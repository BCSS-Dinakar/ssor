# SSOR — State Sexual Offender Registry

> A secure, conviction-based, colour-coded sexual offender registry built for the **Government of Telangana, State Police** — enabling verified background checks for institutions and structured monitoring for the police, without ever becoming an open public list.

---

## 💡 Project Idea

The State Sexual Offender Registry (SSOR) is designed to protect women and children by tracking convicted sexual offenders. Unlike public offender registries (such as in the United States) which can lead to vigilantism and privacy violations, SSOR follows a **controlled-disclosure model** used in the UK, Canada, and Australia. 

The system operates strictly on **convictions** (accused persons are never listed) and is entirely closed to the general public. Instead, it serves as a secure clearinghouse for background verification.

### Two-Portal System
1. **Organization Portal**: Schools, creches, care homes, and transport operators can register their institutions. Once approved, they can submit vetting requests for prospective employees to ensure they have no history of sexual offences.
2. **Police & Administration Portal**: Restricted exclusively to vetted police officers. Officers can manage the registry, review and approve organization registrations, and process vetting requests.

---

## 🏗️ Project Architecture

SSOR is built as a **Full-Stack Monorepo**, dividing concerns cleanly between a client-side interface and a secure API backend.

### 1. The Frontend (Client Layer)
Located in the `frontend/` directory, the client is a **React.js Single Page Application (SPA)**. 
- It handles complex multi-step registration flows for organizations.
- It dynamically renders completely different dashboard experiences based on the user's role (Police vs. Organization), populated with real-time analytics.
- It communicates securely with the backend using Axios, passing HTTP-only session cookies automatically.

### 2. The Backend (API Layer)
Located in the `backend/` directory, the API is built with **Node.js, Express, and Prisma ORM**.
- **Role-Based Access Control (RBAC)**: Custom Express middlewares strictly guard routes (`requireAuth`, `requirePolice`) based on the JWT session.
- **Secure File Storage**: Integrates **MinIO Object Storage** to safely store uploaded documents (such as government certificates and authorization letters). During storage outages, uploads seamlessly fall back to local disk storage (`storage/media`), with reconciliation scripts to sync them back.
- **Advanced Authentication**: Uses JWTs signed and delivered via secure, HTTP-only cookies to prevent XSS attacks. Password-based login with role-based access control.
- **Resilient Storage**: MinIO object storage with automatic local-disk fallback when MinIO is unavailable; reconciliation scripts sync disk files back to MinIO.

### 3. The Database (Data Layer)
Powered by **PostgreSQL** (via Prisma) for robust, relational data storage.
- Features a unified `User` model linked in one-to-one relationships with either a `PoliceProfile` or an `OrganizationProfile`.
- Tracks a comprehensive, immutable `SystemAuditLog` for every critical action performed, powering the real-time activity feeds in the dashboards.
- **Foreign Data Wrapper (FDW) Architecture**: SSOR directly mounts remote CCTNS and ePetty databases via FDW schemas (`cctns_etl`, `epetty`). It processes heavy data lookups using **Materialized Views** (`mv_clearance_accused_search`, `mv_e_cases_list`), completely avoiding brittle external HTTP APIs to ensure 100% uptime and sub-second clearance vetting.

---

## 🚦 Getting Started

Please refer to the [`setup.md`](./setup.md) file in the root directory for full, step-by-step instructions on setting up the environment variables, initializing the PostgreSQL database, and starting both servers.

---

## 📜 License

This project is developed for the Government of Telangana, State Police. All rights reserved.
