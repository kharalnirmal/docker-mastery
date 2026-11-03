-- Expand only: old application queries remain valid; existing rows receive NULL.
ALTER TABLE "Task" ADD COLUMN "description" TEXT;
