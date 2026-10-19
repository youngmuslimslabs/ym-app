#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${SUPABASE_DB_URL:?Set a direct/session-pooler Postgres connection URL}"
: "${BACKUP_AGE_RECIPIENT:?Set the age public recipient; keep its private key offline}"
export PGSSLMODE="${PGSSLMODE:-require}"
export PGCONNECT_TIMEOUT=20
export PGOPTIONS='-c statement_timeout=600000 -c lock_timeout=10000'
task_backup_dir="$(mktemp -d)"
trap 'rm -rf "$task_backup_dir"' EXIT
task_output_dir="${1:-backups}"
mkdir -p "$task_output_dir"
task_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
task_output="$task_output_dir/ym-db-$task_timestamp.dump.age"
# Never enable shell tracing: the connection URI contains a database password.
pg_dump --dbname="$SUPABASE_DB_URL" --format=custom --no-owner --no-publications --no-subscriptions \
  --schema=public --schema=auth --schema=supabase_migrations \
  --file="$task_backup_dir/database.dump"
test -s "$task_backup_dir/database.dump"
pg_restore --list "$task_backup_dir/database.dump" > "$task_backup_dir/toc.txt"
grep -q 'TABLE DATA public users' "$task_backup_dir/toc.txt"
grep -q 'TABLE DATA auth users' "$task_backup_dir/toc.txt"
# Upload only encrypted bytes. Failed dumps/encryption never produce a valid artifact.
age --recipient "$BACKUP_AGE_RECIPIENT" --output "$task_output" "$task_backup_dir/database.dump"
test -s "$task_output"
printf 'Encrypted logical snapshot created: %s\n' "$task_output"
