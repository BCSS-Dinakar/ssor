# SSOR Setup Guide

Follow these steps to set up the entire SSOR (State Sexual Offender Registry) stack on your local machine.

## Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database server running locally
- **Redis** server running locally (for OTP caching)

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
Create a `.env` file in the `backend` directory with the following contents. Make sure to update the `DATABASE_URL` with your actual PostgreSQL credentials:
```env
PORT=5001
DATABASE_URL="postgresql://username:password@localhost:5432/ssor_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Database Setup (Prisma)
Ensure your PostgreSQL server is running and the database specified in the URL exists. Generate the Prisma client and push the schema to create the tables:
```bash
npx prisma generate
npx prisma db push
```

### Create Test Accounts & Seed Data (Optional)
Run the provided npm script to seed the database with a test Police Officer, a test Organization account, and dynamic dummy clearance request data:
```bash
npm run db:seed-users
```
*(Check `credentials.txt` in the backend folder for the login details).*

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
- **Uploads Failing**: Ensure the backend has a `storage/documents` folder automatically created (or create it manually).
- **OTP/Login Issues**: Make sure your local **Redis** server is running. If it crashes, the backend will automatically fallback to a `.fallback-cache.json` file.
- **Prisma Errors**: If you get Prisma connection errors, double-check that your PostgreSQL server is active and the `DATABASE_URL` in `.env` is perfectly correct.
