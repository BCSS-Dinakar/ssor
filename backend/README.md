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
- The `upload.middleware.js` (using Multer) intercepts these files and saves them to `backend/storage/documents` with a unique UNIX timestamp (e.g., `org_1783577389612_authLetter.jpg`).
- **Crucially**, these files are *not* placed in a public folder. They can only be retrieved via the `GET /api/auth/documents/:filename` endpoint, which requires authentication and calculates dynamic file metadata (size, date) on the fly using `fs.statSync`.

### 4. Database Schema (Prisma)
- **`User` Model**: The central authentication table holding the `loginId`, hashed password, and `role`.
- **`OrganizationProfile` & `PoliceProfile`**: 1-to-1 relational tables containing the specific metadata for each role.
- **`SystemAuditLog`**: Tracks sensitive actions (like approving an organization) ensuring full accountability.

---

## 🚀 Getting Started

Please refer to the `setup.md` file in the root directory for instructions on how to start this backend server, run Prisma migrations, and seed test data.
