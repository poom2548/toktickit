# Lab 4 Database Rollback and Recovery Procedure

This guide outlines the procedure for recovering from a failed or unintended Lab 4 database migration.

## 1. Take a Snapshot BEFORE Migrating
Always take a snapshot of the database before applying the migration.
```bash
pg_dump -U <user> -h <host> -Fc <database_name> -f <snapshot_path>
```
*Example:*
```bash
pg_dump -U toktickit -h localhost -Fc toktickit -f /tmp/toktickit_before_lab4.dump
```

## 2. Verify the Snapshot
Ensure the snapshot file was created successfully and has a non-zero size.

## 3. Rollback Procedure
If the migration has been applied but you need to revert to the Lab 3 state without dropping the entire database, you can use the rollback script. The forward migration is non-destructive, but this script will intentionally remove Lab 4 data.

Run the rollback script using `psql`:
```bash
psql -U <user> -h <host> -d <database_name> -f prisma/rollback/04-rollback.sql
```
*Example:*
```bash
psql -U toktickit -h localhost -d toktickit -f prisma/rollback/04-rollback.sql
```

## 4. Full Restore Procedure (Alternative)
If you prefer to restore the entire database from the snapshot, use `pg_restore`:
```bash
# Drop the existing database and recreate it
dropdb -U <user> -h <host> <database_name>
createdb -U <user> -h <host> <database_name>

# Restore the snapshot
pg_restore -U <user> -h <host> -d <database_name> -1 <snapshot_path>
```

## 5. Verify Rollback
After performing the rollback or restore, verify the state:
1. Run `npx prisma migrate status` to confirm that the Lab 4 migration is listed as pending (unapplied).
2. Check that the row counts for `Ticket` and `User` tables match the counts before the migration, and the new Lab 4 tables do not exist.
