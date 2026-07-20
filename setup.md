# SSOR Setup Guide

Follow these steps to set up the entire SSOR (State Sexual Offender Registry) stack on your local machine.

## Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

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
Create a `.env` file in the `backend` directory with the following contents:
```env
PORT=8000
DATABASE_URL="file:./db/ssor.db"
JWT_SECRET="your_super_secret_jwt_key_here"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Database Setup (Prisma)
Generate the Prisma client and push the schema to create the SQLite database:
```bash
npx prisma generate
npx prisma db push
```

### Create Test Accounts (Optional)
Run the provided scripts to seed the database with a test Police Officer and a test Organization account:
```bash
node create-bcss-officer.js
node create-bcss-org.js
```
*(Check `credentials.txt` in the backend folder for the login details).*

### Start the Server
Start the backend development server (runs on `http://localhost:8000`):
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
- **CORS Issues**: Ensure the backend `.env` has `FRONTEND_URL="http://localhost:3000"` and that both servers are running on their default ports.
- **Uploads Failing**: Ensure the backend has a `storage/documents` folder automatically created (or create it manually).
- **Prisma Errors**: If you get Prisma errors, delete the `backend/prisma/db` folder and re-run `npx prisma db push`.
