# SSOR Backend

This is the secure REST API layer for the State Sexual Offender Registry (SSOR). It handles all data persistence, authentication, and secure document serving.

---

## 🛠️ Tech Stack

- **Node.js & Express**: The core web framework providing the API routes.
- **Prisma ORM**: A next-generation Object-Relational Mapper ensuring type-safe database queries.
- **SQLite**: A lightweight relational database for development.
- **JWT (JSON Web Tokens)**: Used for stateless, session-based authentication via HTTP-only cookies.
- **Bcrypt.js**: For secure password hashing.
- **Multer**: Middleware for handling `multipart/form-data` during document uploads.
- **MinIO**: S3-compatible object storage for uploaded documents (with legacy on-disk read fallback).

---

## 🔄 Project Flow & Architecture

### 1. Authentication Flow
- When a user logs in via `POST /api/auth/login`, the backend verifies their credentials using `bcrypt`.
- If successful, a JWT payload containing the user's ID and Role is signed.
- This JWT is placed into an **HTTP-only cookie**. This prevents the frontend JavaScript from ever touching the token, mitigating Cross-Site Scripting (XSS) risks.

### 2. Route Protection (Middleware)
Every route that accesses private data passes through middleware:
- **`requireAuth`**: Validates the JWT cookie. If valid, it attaches the user object to `req.user`.
- **`requirePolice`**: A secondary guard applied to sensitive routes (e.g., viewing logs or approving organizations) ensuring `req.user.role === 'police'`.

### 3. File Uploads & Document Security
- When an organization registers, they upload sensitive PDF/Image documents.
- `upload.middleware.js` (Multer, in-memory) intercepts these files; the `persistUploads` middleware then streams each buffer into **MinIO** (S3-compatible object storage) under a unique key (e.g., `org_1783577389612_authLetter.jpg`). The DB stores only this key.
- **Crucially**, these files are *not* placed in a public folder. They can only be retrieved via the authenticated `GET /api/*/documents/:filename` endpoints, which stream the object out of MinIO (see `services/storage.service.js`).
- **MinIO-only** — `storage.service.js` reads/writes exclusively from MinIO. The previous local-disk fallback (`backend/storage/documents`) has been removed; if MinIO is unreachable, uploads fail fast with a `503` rather than silently landing on disk.
- `scripts/migrate-storage-to-minio.js` (`npm run storage:migrate`) remains as a one-shot importer for any legacy on-disk files, should you ever restore some.

#### Running MinIO
```bash
# From the repo root — starts MinIO on :9000 (API) and :9001 (console)
docker compose -f docker-compose.minio.yml up -d

# Configure credentials/bucket in backend/.env (MINIO_* vars). Defaults: minioadmin/minioadmin,
# bucket ssor-documents (shared by both the legacy and structured flows). Auto-created on startup.
```

### 3b. Media registry & signed URLs
Every uploaded file is registered in the central **`Media`** table, and the app tables reference it by **id** (not by path or URL). At access time the API resolves that id to a fresh, short-lived **signed URL** (1h) and returns it inline — nothing openable is ever persisted.

- **`Media` row** has an auto-increment integer `id` and stores the MinIO object info: `bucketName`, `objectKey`, `originalName`, `fileType`, `fileSize`, `category`, `uploadedBy`. See `services/media.service.js`.
- **Reference by id** — `CandidateVerification.candidateMediaId/consentMediaId`, `OrganizationProfile.authLetterMediaId/govCertMediaId/supportingDocsMediaIds[]`, and `PoliceProfile.docsMediaIds[]` all hold a `Media.id` (int).
- **Inline resolution** — `resolveMediaUrl(id)` mints a signed URL on demand; `withVerificationUrls()` swaps the ids for URLs in API responses. The bucket stays private; an unsigned GET returns `403`.
- The legacy `GET /api/*/documents/:ref` (stream) and `/:ref/url` (signed URL) endpoints accept a `Media.id` and resolve it via `resolveObjectKey()`.
- **Applied via** `prisma/sql/2026_add_media_table.sql` (`prisma db execute`), **not** `prisma db push` — the Prisma schema only models a subset of this DB.
- **Backfill** existing rows with `node scripts/backfill-media.js` (idempotent).

### 4. Database Schema (Prisma)
- **`User` Model**: The central authentication table holding the `loginId`, hashed password, and `role`.
- **`OrganizationProfile` & `PoliceProfile`**: 1-to-1 relational tables containing the specific metadata for each role.
- **`SystemAuditLog`**: Tracks sensitive actions (like approving an organization) ensuring full accountability.
- **`Media`**: Central registry of every MinIO file (object key, bucket, type, size, category). App tables reference it by `id`; signed URLs are generated on demand and never stored.

---

## 🚀 Getting Started

Please refer to the `setup.md` file in the root directory for instructions on how to start this backend server, run Prisma migrations, and seed test data.
