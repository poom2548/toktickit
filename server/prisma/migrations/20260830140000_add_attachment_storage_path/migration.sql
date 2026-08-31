-- AlterTable: add storagePath column to Attachment
-- Default '' keeps existing rows valid; new uploads will always populate it.
ALTER TABLE "Attachment" ADD COLUMN "storagePath" TEXT NOT NULL DEFAULT '';
