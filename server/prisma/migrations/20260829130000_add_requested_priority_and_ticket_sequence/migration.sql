-- AlterTable: add requestedPriority to Ticket (default 'Low' for existing rows)
ALTER TABLE "Ticket" ADD COLUMN "requestedPriority" TEXT NOT NULL DEFAULT 'Low';

-- CreateSequence: provides a race-free, ever-incrementing counter for ticket numbers.
-- The sequence starts at 1 so the first ticket gets TKT-0001.
-- If existing tickets are already in the DB, adjust START WITH to match
-- the current row count + 1 so we never reuse a number.
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
