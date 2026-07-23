-- Additive: central Media registry for all MinIO files. Applied via
-- `prisma db execute` (NOT db push) so unmanaged CCTNS tables are left alone.

CREATE TABLE IF NOT EXISTS "Media" (
  "id"           SERIAL PRIMARY KEY,
  "bucketName"   TEXT NOT NULL,
  "objectKey"    TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "fileType"     TEXT,
  "fileSize"     INTEGER,
  "category"     TEXT,
  "uploadedBy"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Media_objectKey_key" UNIQUE ("objectKey")
);

CREATE INDEX IF NOT EXISTS "Media_category_idx" ON "Media"("category");
