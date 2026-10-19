# Database snapshots (#60)

Status: encrypted automatic/manual workflow implemented; production credentials
and the first hosted backup/restore rehearsal are pending.

The repository is public. Raw database dumps must never be uploaded as Actions
artifacts. The backup job uploads only an **age-encrypted** custom-format archive,
retained for 30 days. It runs after successful push-to-main CI, or manually from
main. It never runs a privileged backup against PR code. This adds no Supabase
backup feature charge; GitHub storage/minute quotas still apply.

## One-time setup

Generate a recovery key on a trusted offline machine with `age-keygen -o recovery.key`.
Store that private key in the organization's recovery vault, separately from GitHub.
Set its public recipient as `BACKUP_AGE_RECIPIENT` in the GitHub **Production**
environment variables. Set **Production** secret `SUPABASE_DB_URL` to a database
connection string with sufficient dump privileges, using the direct host or the
IPv4 session pooler on port 5432 (not transaction pooler 6543). API/service-role
keys are not database passwords. Require Production environment reviewers if
the organization needs approval before reading a live snapshot.

For an on-demand snapshot, open Actions → Database backup → Run workflow → main.
Missing configuration fails visibly. A successful job checks the archive's table
of contents before encryption; this proves a readable dump, **not** a successful
restore. Test recovery before relying on the backup.

## Contents and limits

The archive captures public app schema/data, Auth schema/data and migration history
from one `pg_dump` snapshot, including grants, policies, functions and triggers belonging
to these schemas. Use a pg_dump major version matching or newer than the server;
the workflow currently targets the app's PostgreSQL 17 server.

It is a logical snapshot, not a whole Supabase project image. It does not include
Storage files, project settings, provider secrets, encryption root keys, external
services, custom database-role passwords, realtime publication setup or roles outside these schemas. Public
functions referenced by triggers on Auth tables are included, as are those Auth
triggers. Preserve the project's encryption key/settings separately where needed.

## Recovery rehearsal

1. Download the encrypted artifact, decrypt locally with
   `age --decrypt -i recovery.key -o database.dump <artifact>.dump.age`.
2. Inspect `pg_restore --list database.dump`; use a disposable PostgreSQL/Supabase
   target, with the matching extensions and roles. Never rehearse on the source.
3. For a disposable **plain Postgres fixture**, restore with
   `pg_restore --exit-on-error --single-transaction --no-owner --dbname "$RESTORE_DB_URL" database.dump`.
   Provision the source database roles first. Do not discard ACLs with
   `--no-privileges` unless the reviewed application grants are reapplied separately.
   A fresh plain Postgres database already contains an empty `public` schema;
   drop that empty schema before replaying the archive's CREATE SCHEMA statement.
   Empty the target only if it is a disposable test database.
4. A **hosted Supabase** target already owns Auth objects. Do not blindly replay
   the full Auth DDL or use `--clean` against it. Follow Supabase's migration guide:
   restore public schema, restore Auth data into compatible managed tables, then
   restore app data and custom triggers/policies in dependency order. Review the
   archive list and use a selected restore list when necessary. Validate project
   encryption settings. A successful plain-Postgres rehearsal does not verify
   managed-Supabase recovery.
5. Compare row counts, role assignments and migration history; test member login,
   admin access, session signup/check-in and feedback. Record date, archive run ID,
   server versions, errors and results in #60. Delete decrypted temporary files.

The committed database regression suite tests dump → encryption → decryption →
restore against synthetic fixtures when `age` is installed. No production dump
or live restore was executed during implementation.

Source: [Supabase backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
[backup scope](https://supabase.com/docs/guides/platform/backups).
