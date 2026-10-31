-- This script intentionally removes all Lab 4 data and is for recovery only.
-- The forward migration itself is non-destructive and additive only.
-- It safely drops the Lab 4 tables and columns, and deletes the migration record.

BEGIN;

-- Drop Lab 4 tables (IdempotencyKey, ActionTaken, TicketStatusHistory)
DROP TABLE IF EXISTS "IdempotencyKey";
DROP TABLE IF EXISTS "ActionTaken";
DROP TABLE IF EXISTS "TicketStatusHistory";

-- Drop Lab 4 columns from Ticket
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "requesterMarkedResolvedAt";

-- Delete the Lab 4 migration from Prisma's tracking table
DELETE FROM _prisma_migrations WHERE migration_name = '20261007031412_lab4_actions_taken_foundation';

COMMIT;
