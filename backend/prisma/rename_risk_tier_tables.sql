-- One-time rename for existing databases (ssor_kb + RiskTierDefinition → RiskTierSection + RiskTier).
-- Safe to run multiple times; each step checks for the old name before renaming.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'RiskTierDefinition'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'RiskTier'
  ) THEN
    ALTER TABLE "RiskTierDefinition" RENAME TO "RiskTier";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ssor_kb'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'RiskTierSection'
  ) THEN
    ALTER TABLE ssor_kb RENAME TO "RiskTierSection";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S' AND c.relname = 'ssor_kb_id_seq'
  ) THEN
    ALTER SEQUENCE ssor_kb_id_seq RENAME TO "RiskTierSection_id_seq";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ssor_kb_pkey'
  ) THEN
    ALTER TABLE "RiskTierSection" RENAME CONSTRAINT ssor_kb_pkey TO "RiskTierSection_pkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_ssor_kb_section'
  ) THEN
    ALTER TABLE "RiskTierSection" RENAME CONSTRAINT uq_ssor_kb_section TO "RiskTierSection_act_name_section_code_key";
  END IF;
END $$;
