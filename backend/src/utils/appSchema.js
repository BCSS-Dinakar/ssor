import pg from 'pg';
import { env } from '../config/env.js';

const { Client } = pg;

const appSchemaSql = `
CREATE TABLE IF NOT EXISTS public."User" (
  "id" TEXT NOT NULL,
  "loginId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_loginId_key"
  ON public."User"("loginId");

CREATE TABLE IF NOT EXISTS public."SystemAuditLog" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."PoliceProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "badgeId" TEXT,
  "rank" TEXT,
  "empId" TEXT,
  "department" TEXT,
  "wing" TEXT,
  "jurisdiction" TEXT,
  "joiningDate" TEXT,
  "email" TEXT,
  "mobile" TEXT,
  "altPhone" TEXT,
  "station" TEXT,
  "district" TEXT,
  "state" TEXT,
  "country" TEXT,
  "clearanceLevel" TEXT,
  "docsPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "PoliceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PoliceProfile_userId_key"
  ON public."PoliceProfile"("userId");

CREATE TABLE IF NOT EXISTS public."OrganizationProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orgName" TEXT NOT NULL,
  "orgType" TEXT NOT NULL,
  "parentOrg" TEXT,
  "department" TEXT,
  "jurisdiction" TEXT,
  "country" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "pinCode" TEXT NOT NULL,
  "officialEmail" TEXT NOT NULL,
  "officialPhone" TEXT NOT NULL,
  "altPhone" TEXT,
  "website" TEXT,
  "adminName" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "empId" TEXT NOT NULL,
  "adminEmail" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "authLetterPath" TEXT,
  "govCertPath" TEXT,
  "supportingDocsPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationProfile_userId_key"
  ON public."OrganizationProfile"("userId");

CREATE TABLE IF NOT EXISTS public."CandidateVerification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "orgName" TEXT NOT NULL,
  "orgType" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "candidateName" TEXT NOT NULL,
  "dob" TIMESTAMP(3) NOT NULL,
  "fatherName" TEXT,
  "phone" TEXT NOT NULL,
  "consent" BOOLEAN NOT NULL,
  "aadharNumber" TEXT,
  "candidateImage" TEXT,
  "consentFile" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "policeFeedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'Medium',
  "reference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "assignee" TEXT DEFAULT 'Unassigned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key"
  ON public."SupportTicket"("ticketNumber");

CREATE TABLE IF NOT EXISTS public."TicketMessage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."EPettyCase" (
  "id" TEXT NOT NULL,
  "caseNumber" TEXT NOT NULL,
  "offenderName" TEXT NOT NULL,
  "alias" TEXT,
  "age" INTEGER,
  "fatherName" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "policeStation" TEXT,
  "district" TEXT,
  "incidentDate" TEXT,
  "offenceType" TEXT,
  "penaltyAmount" DOUBLE PRECISION DEFAULT 500.0,
  "disposalStatus" TEXT DEFAULT 'Fine Paid',
  "riskTier" TEXT NOT NULL DEFAULT 'Orange',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EPettyCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EPettyCase_caseNumber_key"
  ON public."EPettyCase"("caseNumber");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SystemAuditLog_userId_fkey'
      AND conrelid = 'public."SystemAuditLog"'::regclass
  ) THEN
    ALTER TABLE public."SystemAuditLog"
      ADD CONSTRAINT "SystemAuditLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES public."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PoliceProfile_userId_fkey'
      AND conrelid = 'public."PoliceProfile"'::regclass
  ) THEN
    ALTER TABLE public."PoliceProfile"
      ADD CONSTRAINT "PoliceProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES public."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'OrganizationProfile_userId_fkey'
      AND conrelid = 'public."OrganizationProfile"'::regclass
  ) THEN
    ALTER TABLE public."OrganizationProfile"
      ADD CONSTRAINT "OrganizationProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES public."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CandidateVerification_organizationId_fkey'
      AND conrelid = 'public."CandidateVerification"'::regclass
  ) THEN
    ALTER TABLE public."CandidateVerification"
      ADD CONSTRAINT "CandidateVerification_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES public."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SupportTicket_organizationId_fkey'
      AND conrelid = 'public."SupportTicket"'::regclass
  ) THEN
    ALTER TABLE public."SupportTicket"
      ADD CONSTRAINT "SupportTicket_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES public."User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TicketMessage_ticketId_fkey'
      AND conrelid = 'public."TicketMessage"'::regclass
  ) THEN
    ALTER TABLE public."TicketMessage"
      ADD CONSTRAINT "TicketMessage_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`;

export const initAppSchema = async () => {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL or POSTGRES_* database settings are required.');
  }

  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(appSchemaSql);
    await client.query('COMMIT');
    console.log('SSOR app tables are ready.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
};
