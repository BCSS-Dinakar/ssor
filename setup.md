# SSOR Setup Guide

Follow these steps to set up the entire SSOR (State Sexual Offender Registry) stack on your local machine.

## Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database server running locally
- **MinIO** server running locally (for secure document uploads and storage)

---

## 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file in the `backend` directory with the following contents. Make sure to update the credentials with your actual database and MinIO settings:
```env
# Database
PORT=5001
DATABASE_URL="postgresql://username:password@localhost:5432/ssor_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# MinIO Storage
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=ssor-documents
```

### Database Setup (Prisma)
Ensure your PostgreSQL server is running and the database specified in the URL exists. Generate the Prisma client and push the schema to create the tables:
```bash
npx prisma generate
npx prisma db push
```

### Create Test Accounts (Development Only)
When `NODE_ENV` is not `production` and the user table is empty, the server automatically seeds default dev accounts (`police@ssor` / `org@ssor`, password `ssor@123`) on startup via `autoSetup.js`.

Police and admin accounts in production must be created through the admin portal, not public registration.

### Start the Server
Start the backend development server:
```bash
npm run dev
```

---

## 2. Frontend Setup

Open a **new** terminal window/tab and navigate to the `frontend` directory:
```bash
cd frontend
```

### Install Dependencies
```bash
npm install
```

### Start the Client
Start the React development server:
```bash
npm start
```

The frontend will automatically open in your browser at [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting
- **CORS Issues**: Ensure the backend `.env` has `FRONTEND_URL="http://localhost:3000"`.
- **MinIO/Uploads Failing**: Make sure your MinIO container is running, the credentials match `.env`, and the bucket has been created successfully. If MinIO is unreachable, backend falls back to local disk storage (`storage/media`).
- **Prisma Errors**: If you get Prisma connection errors, double-check that your PostgreSQL server is active and the `DATABASE_URL` in `.env` is perfectly correct.
