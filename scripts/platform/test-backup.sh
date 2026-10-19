#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${TEST_DATABASE_URL:?Set the disposable local PostgreSQL URL}"
case "$TEST_DATABASE_URL" in *\?*|*\#*) echo 'Test URLs cannot override connection settings'; exit 1 ;; esac
case "$TEST_DATABASE_URL" in
  postgresql://*@localhost:*/*|postgresql://*@127.0.0.1:*/*) ;;
  *) echo 'Refusing non-local backup rehearsal'; exit 1 ;;
esac
task_temp="$(mktemp -d)"
task_target="ym_restore_$(date -u +%Y%m%d%H%M%S)_$$"
task_target_url="${TEST_DATABASE_URL%/*}/$task_target"
task_created=false
cleanup() {
  if "$task_created"; then
    psql -X "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE $task_target" >/dev/null
  fi
  rm -rf "$task_temp"
}
trap cleanup EXIT
age-keygen -o "$task_temp/recovery.key" 2>/dev/null
export BACKUP_AGE_RECIPIENT
BACKUP_AGE_RECIPIENT="$(age-keygen -y "$task_temp/recovery.key")"
SUPABASE_DB_URL="$TEST_DATABASE_URL" PGSSLMODE=disable bash scripts/platform/backup.sh "$task_temp/output"
task_archives=("$task_temp/output/"*.dump.age)
test "${#task_archives[@]}" -eq 1
test -z "$(find "$task_temp/output" -name '*.dump' -print)"
age --decrypt -i "$task_temp/recovery.key" -o "$task_temp/restored.dump" "${task_archives[0]}"
psql -X "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $task_target" >/dev/null
task_created=true
# A new Postgres database has a default public schema; the archive creates it.
# No CASCADE: refuse to delete it if the supposedly empty target has objects.
psql -X "$task_target_url" -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public' >/dev/null
pg_restore --exit-on-error --single-transaction --no-owner --dbname "$task_target_url" "$task_temp/restored.dump"
task_count_sql='SELECT (SELECT count(*) FROM public.users), (SELECT count(*) FROM public.role_assignments), (SELECT count(*) FROM public.neighbor_nets)'
test "$(psql -XAt "$TEST_DATABASE_URL" -c "$task_count_sql")" = "$(psql -XAt "$task_target_url" -c "$task_count_sql")"
test "$(psql -XAt "$task_target_url" -c "SELECT has_function_privilege('anon','public.check_in_to_session(uuid,text)','EXECUTE')")" = f
echo 'Encrypted snapshot restored; member, role and geography counts match; RPC ACL preserved.'
