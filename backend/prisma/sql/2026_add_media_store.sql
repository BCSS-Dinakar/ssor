-- Additive: track where each Media object lives so reads can fall back to disk
-- when it was written during a MinIO outage. Applied via `prisma db execute`.

ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "store" TEXT NOT NULL DEFAULT 'minio';
CREATE INDEX IF NOT EXISTS "Media_store_idx" ON "Media"("store");
