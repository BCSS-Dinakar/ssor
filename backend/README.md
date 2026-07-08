# SSOR Backend

This is the backend API for the **State Sexual Offender Register (SSOR)** system.
Built using Node.js, Express, Prisma, and PostgreSQL.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   Copy `.env.example` to `.env` and configure your database URL.

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Architecture

- **`src/config/`**: Database and Environment configuration.
- **`src/routes/`**: API route definitions.
- **`src/controllers/`**: Request handlers and business logic.
- **`src/app.js`**: Express configuration and middleware setup.
- **`src/server.js`**: Application entry point.
