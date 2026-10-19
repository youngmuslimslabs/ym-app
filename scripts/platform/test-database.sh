#!/usr/bin/env bash
set -euo pipefail
: "${TEST_DATABASE_URL:?Point to an EMPTY disposable local PostgreSQL database}"
case "$TEST_DATABASE_URL" in *\?*|*\#*) echo 'Test URLs cannot override connection settings'; exit 1 ;; esac
# This runner intentionally cannot target a hosted database.
case "$TEST_DATABASE_URL" in
  postgresql://*@localhost:*/*|postgresql://*@127.0.0.1:*/*) ;;
  *) echo 'Refusing non-local test database'; exit 1 ;;
esac
psql -X --dbname="$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/bootstrap.sql
for task_migration in supabase/migrations/*.sql; do
  psql -X --dbname="$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$task_migration"
done
psql -X --dbname="$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
psql -X --dbname="$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security.sql
