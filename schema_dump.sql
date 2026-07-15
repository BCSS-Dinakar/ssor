--
-- PostgreSQL database dump
--

\restrict QXEkdQlNBoE1gCqJ8DcWl6mWhMYnfavxntRX7ba3p0JNXr5E0lVFqfLqKKcB0lf

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

-- Started on 2026-07-15 15:13:19 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 33937)
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- TOC entry 3 (class 3079 OID 33983)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 4 (class 3079 OID 33995)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 5 (class 3079 OID 34076)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 6 (class 3079 OID 34113)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- TOC entry 7 (class 3079 OID 34120)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 7
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 8 (class 3079 OID 34131)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 8
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- TOC entry 1214 (class 1247 OID 34460)
-- Name: source_field_enum; Type: TYPE; Schema: public; Owner: cctns_prod
--

CREATE TYPE public.source_field_enum AS ENUM (
    'FIR_COPY',
    'MEDIA',
    'INTERROGATION_REPORT',
    'DOPAMS_DATA',
    'IDENTITY_DETAILS',
    'MO_MEDIA',
    'uploadChargeSheet'
);


ALTER TYPE public.source_field_enum OWNER TO cctns_prod;

--
-- TOC entry 1217 (class 1247 OID 34476)
-- Name: source_type_enum; Type: TYPE; Schema: public; Owner: cctns_prod
--

CREATE TYPE public.source_type_enum AS ENUM (
    'crime',
    'interrogation',
    'property',
    'person',
    'mo_seizures',
    'chargesheets',
    'case_property'
);


ALTER TYPE public.source_type_enum OWNER TO cctns_prod;

--
-- TOC entry 439 (class 1255 OID 34491)
-- Name: auto_generate_file_paths(); Type: FUNCTION; Schema: public; Owner: cctns_prod
--

CREATE FUNCTION public.auto_generate_file_paths() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    v_path VARCHAR(500);
    v_url VARCHAR(1000);
    v_extension VARCHAR(50);
BEGIN
    -- Only generate paths if file_id is not NULL
    IF NEW.file_id IS NOT NULL THEN
        v_path := generate_file_path(NEW.source_type, NEW.source_field, NEW.file_id);
        v_url := generate_file_url(NEW.source_type, NEW.source_field, NEW.file_id);
        
        -- Ensure no spaces in path
        IF v_path IS NOT NULL THEN
            NEW.file_path := REPLACE(TRIM(v_path), ' ', '');
        ELSE
            NEW.file_path := NULL;
        END IF;
        
        -- Generate URL with extension preservation
        IF v_url IS NOT NULL THEN
            v_url := REPLACE(TRIM(v_url), ' ', '');
            
            -- ================================================================
            -- EXTENSION PRESERVATION LOGIC (UNIVERSAL - ALL FILE TYPES)
            -- ================================================================
            -- Works for both INSERT and UPDATE operations
            -- Preserves extensions for ANY file type (not hardcoded list)
            
            IF TG_OP = 'UPDATE' AND OLD.file_url IS NOT NULL THEN
                -- UPDATE: Try to extract extension from OLD URL
                -- Regex pattern: matches any extension (letters/numbers/hyphens)
                v_extension := (regexp_matches(OLD.file_url, '\.([a-zA-Z0-9\-_]+)(?:\?|#|$)', 'g'))[1];
                
                IF v_extension IS NOT NULL AND length(trim(v_extension)) > 0 THEN
                    -- Preserve existing extension
                    NEW.file_url := v_url || '.' || lower(trim(v_extension));
                ELSE
                    -- No extension found, use generated URL
                    NEW.file_url := v_url;
                END IF;
            
            ELSIF TG_OP = 'INSERT' THEN
                -- INSERT: Check if application provided file_url with extension
                IF NEW.file_url IS NOT NULL AND NEW.file_url ~ '\.[a-zA-Z0-9\-_]+(?:\?|#|$)' THEN
                    -- Extract extension from provided URL
                    v_extension := (regexp_matches(NEW.file_url, '\.([a-zA-Z0-9\-_]+)(?:\?|#|$)', 'g'))[1];
                    
                    IF v_extension IS NOT NULL AND length(trim(v_extension)) > 0 THEN
                        -- Use generated URL with provided extension
                        NEW.file_url := v_url || '.' || lower(trim(v_extension));
                    ELSE
                        NEW.file_url := v_url;
                    END IF;
                ELSE
                    -- No extension provided, use generated URL
                    NEW.file_url := v_url;
                END IF;
            
            ELSE
                -- UPDATE with NULL OLD.file_url
                NEW.file_url := v_url;
            END IF;
            
        ELSE
            NEW.file_url := NULL;
        END IF;
    ELSE
        NEW.file_path := NULL;
        NEW.file_url := NULL;
    END IF;
    
    RETURN NEW;
END;
$_$;


ALTER FUNCTION public.auto_generate_file_paths() OWNER TO cctns_prod;

--
-- TOC entry 575 (class 1255 OID 34492)
-- Name: enforce_case_property_mo_reference(); Type: FUNCTION; Schema: public; Owner: cctns_prod
--

CREATE FUNCTION public.enforce_case_property_mo_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.mo_id IS NULL OR BTRIM(NEW.mo_id) = '' THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.mo_seizures ms
        WHERE ms.crime_id = NEW.crime_id
          AND ms.mo_id = NEW.mo_id
    ) THEN
        RAISE EXCEPTION 'Invalid MO reference: crime_id=% and mo_id=% not found in mo_seizures', NEW.crime_id, NEW.mo_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_case_property_mo_reference() OWNER TO cctns_prod;

--
-- TOC entry 386 (class 1255 OID 34493)
-- Name: generate_file_path(public.source_type_enum, public.source_field_enum, uuid); Type: FUNCTION; Schema: public; Owner: cctns_prod
--

CREATE FUNCTION public.generate_file_path(p_source_type public.source_type_enum, p_source_field public.source_field_enum, p_file_id uuid) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_path VARCHAR(500);
BEGIN
    IF p_file_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Original APIs
    IF p_source_type = 'crime' AND p_source_field = 'FIR_COPY' THEN
        v_path := '/crimes/' || p_file_id::TEXT;
    ELSIF p_source_type = 'crime' AND p_source_field = 'MEDIA' THEN
        -- Backward-compatibility for historical files rows tagged as crime/MEDIA.
        v_path := '/crimes/' || p_file_id::TEXT;
    ELSIF p_source_type = 'person' AND p_source_field = 'MEDIA' THEN
        v_path := '/person/media/' || p_file_id::TEXT;
    ELSIF p_source_type = 'person' AND p_source_field = 'IDENTITY_DETAILS' THEN
        v_path := '/person/identitydetails/' || p_file_id::TEXT;
    ELSIF p_source_type = 'property' AND p_source_field = 'MEDIA' THEN
        v_path := '/property/' || p_file_id::TEXT;
    ELSIF p_source_type = 'interrogation' AND p_source_field = 'MEDIA' THEN
        v_path := '/interrogations/media/' || p_file_id::TEXT;
    ELSIF p_source_type = 'interrogation' AND p_source_field = 'INTERROGATION_REPORT' THEN
        v_path := '/interrogations/interrogationreport/' || p_file_id::TEXT;
    ELSIF p_source_type = 'interrogation' AND p_source_field = 'DOPAMS_DATA' THEN
        v_path := '/interrogations/dopamsdata/' || p_file_id::TEXT;

    -- New APIs
    ELSIF p_source_type = 'mo_seizures' AND p_source_field = 'MO_MEDIA' THEN
        v_path := '/mo_seizures/' || p_file_id::TEXT;
    ELSIF p_source_type = 'chargesheets' AND p_source_field = 'uploadChargeSheet' THEN
        v_path := '/chargesheets/' || p_file_id::TEXT;
    ELSIF p_source_type = 'case_property' AND p_source_field = 'MEDIA' THEN
        v_path := '/fsl_case_property/' || p_file_id::TEXT;
    ELSE
        v_path := NULL;
    END IF;

    RETURN v_path;
END;
$$;


ALTER FUNCTION public.generate_file_path(p_source_type public.source_type_enum, p_source_field public.source_field_enum, p_file_id uuid) OWNER TO cctns_prod;

--
-- TOC entry 563 (class 1255 OID 34494)
-- Name: generate_file_url(public.source_type_enum, public.source_field_enum, uuid); Type: FUNCTION; Schema: public; Owner: cctns_prod
--

CREATE FUNCTION public.generate_file_url(p_source_type public.source_type_enum, p_source_field public.source_field_enum, p_file_id uuid) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_base_url VARCHAR(255) := 'http://192.168.103.106:8080/files';
    v_path VARCHAR(500);
BEGIN
    v_path := generate_file_path(p_source_type, p_source_field, p_file_id);
    
    IF v_path IS NOT NULL THEN
        RETURN v_base_url || v_path;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;


ALTER FUNCTION public.generate_file_url(p_source_type public.source_type_enum, p_source_field public.source_field_enum, p_file_id uuid) OWNER TO cctns_prod;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 320 (class 1259 OID 37442)
-- Name: CandidateVerification; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."CandidateVerification" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "orgName" text NOT NULL,
    "orgType" text NOT NULL,
    role text NOT NULL,
    "candidateName" text NOT NULL,
    dob timestamp(3) without time zone NOT NULL,
    "fatherName" text,
    phone text NOT NULL,
    consent boolean NOT NULL,
    "aadharNumber" text,
    "candidateImage" text,
    "consentFile" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "policeFeedback" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CandidateVerification" OWNER TO cctns_prod;

--
-- TOC entry 323 (class 1259 OID 37473)
-- Name: EPettyCase; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."EPettyCase" (
    id text NOT NULL,
    "caseNumber" text NOT NULL,
    "offenderName" text NOT NULL,
    alias text,
    age integer,
    "fatherName" text,
    phone text NOT NULL,
    email text,
    address text,
    "policeStation" text,
    district text,
    "incidentDate" text,
    "offenceType" text,
    "penaltyAmount" double precision DEFAULT 500.0,
    "disposalStatus" text DEFAULT 'Fine Paid'::text,
    "riskTier" text DEFAULT 'Orange'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EPettyCase" OWNER TO cctns_prod;

--
-- TOC entry 319 (class 1259 OID 37433)
-- Name: OrganizationProfile; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."OrganizationProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orgName" text NOT NULL,
    "orgType" text NOT NULL,
    "parentOrg" text,
    department text,
    jurisdiction text,
    country text NOT NULL,
    state text NOT NULL,
    district text NOT NULL,
    city text NOT NULL,
    address text NOT NULL,
    "pinCode" text NOT NULL,
    "officialEmail" text NOT NULL,
    "officialPhone" text NOT NULL,
    "altPhone" text,
    website text,
    "adminName" text NOT NULL,
    designation text NOT NULL,
    "empId" text NOT NULL,
    "adminEmail" text NOT NULL,
    mobile text NOT NULL,
    "authLetterPath" text,
    "govCertPath" text,
    "supportingDocsPaths" text[] DEFAULT ARRAY[]::text[] NOT NULL
);


ALTER TABLE public."OrganizationProfile" OWNER TO cctns_prod;

--
-- TOC entry 318 (class 1259 OID 37424)
-- Name: PoliceProfile; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."PoliceProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "badgeId" text,
    rank text,
    "empId" text,
    department text,
    wing text,
    jurisdiction text,
    "joiningDate" text,
    email text,
    mobile text,
    "altPhone" text,
    station text,
    district text,
    state text,
    country text,
    "clearanceLevel" text,
    "docsPaths" text[] DEFAULT ARRAY[]::text[] NOT NULL
);


ALTER TABLE public."PoliceProfile" OWNER TO cctns_prod;

--
-- TOC entry 321 (class 1259 OID 37452)
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."SupportTicket" (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    "organizationId" text NOT NULL,
    subject text NOT NULL,
    category text NOT NULL,
    priority text DEFAULT 'Medium'::text NOT NULL,
    reference text,
    status text DEFAULT 'Open'::text NOT NULL,
    assignee text DEFAULT 'Unassigned'::text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupportTicket" OWNER TO cctns_prod;

--
-- TOC entry 317 (class 1259 OID 37415)
-- Name: SystemAuditLog; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."SystemAuditLog" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SystemAuditLog" OWNER TO cctns_prod;

--
-- TOC entry 316 (class 1259 OID 37414)
-- Name: SystemAuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public."SystemAuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemAuditLog_id_seq" OWNER TO cctns_prod;

--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 316
-- Name: SystemAuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public."SystemAuditLog_id_seq" OWNED BY public."SystemAuditLog".id;


--
-- TOC entry 322 (class 1259 OID 37465)
-- Name: TicketMessage; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."TicketMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "senderName" text NOT NULL,
    "senderRole" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketMessage" OWNER TO cctns_prod;

--
-- TOC entry 315 (class 1259 OID 37404)
-- Name: User; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "loginId" text NOT NULL,
    "passwordHash" text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO cctns_prod;

--
-- TOC entry 223 (class 1259 OID 34495)
-- Name: accused; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.accused (
    accused_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    person_id character varying(50),
    accused_code character varying(20) NOT NULL,
    type character varying(50) DEFAULT 'Accused'::character varying,
    seq_num character varying(50),
    is_ccl boolean DEFAULT false,
    beard character varying(100),
    build character varying(100),
    color character varying(100),
    ear character varying(100),
    eyes character varying(100),
    face character varying(100),
    hair character varying(100),
    height character varying(100),
    leucoderma character varying(100),
    mole character varying(100),
    mustache character varying(100),
    nose character varying(100),
    teeth character varying(100),
    date_created timestamp without time zone,
    date_modified timestamp without time zone,
    accused_status text
);


ALTER TABLE public.accused OWNER TO cctns_prod;

--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE accused; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.accused IS 'Links persons to crimes as accused with physical features';


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN accused.person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.accused.person_id IS 'Can be NULL - stub persons are created by ETL when needed';


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN accused.is_ccl; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.accused.is_ccl IS 'Is Child in Conflict with Law';


--
-- TOC entry 224 (class 1259 OID 34502)
-- Name: arrests; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.arrests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    crime_id character varying(50) NOT NULL,
    person_id character varying(50),
    accused_seq_no text,
    accused_code text,
    accused_type text,
    is_arrested boolean,
    arrested_date timestamp with time zone,
    is_41a_crpc boolean,
    is_41a_explain_submitted boolean,
    date_of_issue_41a date,
    is_ccl boolean,
    is_apprehended boolean,
    is_absconding boolean,
    is_died boolean,
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.arrests OWNER TO cctns_prod;

--
-- TOC entry 225 (class 1259 OID 34508)
-- Name: charge_sheet_updates; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.charge_sheet_updates (
    id integer NOT NULL,
    update_charge_sheet_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    charge_sheet_no character varying(100),
    charge_sheet_date timestamp with time zone,
    charge_sheet_status character varying(100),
    taken_on_file_date timestamp with time zone,
    taken_on_file_case_type character varying(50),
    taken_on_file_court_case_no character varying(100),
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.charge_sheet_updates OWNER TO cctns_prod;

--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE charge_sheet_updates; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.charge_sheet_updates IS 'Stores charge sheet update records from DOPAMS API. Each record represents a charge sheet update with its  

  status and court filing information.';


--
-- TOC entry 226 (class 1259 OID 34511)
-- Name: charge_sheet_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.charge_sheet_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.charge_sheet_updates_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 226
-- Name: charge_sheet_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.charge_sheet_updates_id_seq OWNED BY public.charge_sheet_updates.id;


--
-- TOC entry 227 (class 1259 OID 34512)
-- Name: chargesheet_accused; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheet_accused (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chargesheet_id uuid NOT NULL,
    accused_person_id character varying(50) NOT NULL,
    charge_status character varying(30),
    requested_for_nbw boolean DEFAULT false,
    reason_for_no_charge text,
    is_person_master_present boolean DEFAULT true,
    created_at timestamp with time zone
);


ALTER TABLE public.chargesheet_accused OWNER TO cctns_prod;

--
-- TOC entry 228 (class 1259 OID 34520)
-- Name: chargesheet_acts; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheet_acts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chargesheet_id uuid NOT NULL,
    act_description text,
    section text,
    rw_required boolean DEFAULT false,
    section_description text,
    grave_particulars text,
    created_at timestamp with time zone
);


ALTER TABLE public.chargesheet_acts OWNER TO cctns_prod;

--
-- TOC entry 229 (class 1259 OID 34527)
-- Name: chargesheet_acts_sections; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheet_acts_sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chargesheet_id character varying(50) NOT NULL,
    act_index integer DEFAULT 0 NOT NULL,
    section_index integer DEFAULT 0 NOT NULL,
    act_description text,
    section text,
    rw_required boolean DEFAULT false,
    section_description text,
    grave_particulars text,
    created_at timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.chargesheet_acts_sections OWNER TO cctns_prod;

--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE chargesheet_acts_sections; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.chargesheet_acts_sections IS 'Normalized sections for chargesheets. One row per section entry extracted from actsAndSections[].';


--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN chargesheet_acts_sections.chargesheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_acts_sections.chargesheet_id IS 'API chargeSheetId used as the logical parent key.';


--
-- TOC entry 230 (class 1259 OID 34536)
-- Name: chargesheet_files; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheet_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chargesheet_id uuid NOT NULL,
    file_id character varying(100),
    created_at timestamp with time zone
);


ALTER TABLE public.chargesheet_files OWNER TO cctns_prod;

--
-- TOC entry 231 (class 1259 OID 34540)
-- Name: chargesheet_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheet_media (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chargesheet_id character varying(50) NOT NULL,
    media_index integer DEFAULT 0 NOT NULL,
    file_id character varying(100),
    media_payload jsonb,
    created_at timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.chargesheet_media OWNER TO cctns_prod;

--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE chargesheet_media; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.chargesheet_media IS 'Normalized media references for chargesheets. One row per uploadChargeSheet item.';


--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN chargesheet_media.chargesheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_media.chargesheet_id IS 'API chargeSheetId used as the logical parent key.';


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN chargesheet_media.file_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_media.file_id IS 'uploadChargeSheet.fileId from the API payload.';


--
-- TOC entry 232 (class 1259 OID 34547)
-- Name: chargesheets; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.chargesheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    crime_id character varying(50) NOT NULL,
    chargesheet_no character varying(50),
    chargesheet_no_icjs character varying(50),
    chargesheet_date timestamp with time zone,
    chargesheet_type character varying(50),
    court_name text,
    is_ccl boolean DEFAULT false,
    is_esigned boolean DEFAULT false,
    date_created timestamp with time zone,
    date_modified timestamp with time zone,
    charge_sheet_id character varying(50)
);


ALTER TABLE public.chargesheets OWNER TO cctns_prod;

--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN chargesheets.charge_sheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheets.charge_sheet_id IS 'API chargeSheetId. Natural key used by the chargesheets ETL for overwrite semantics.';


--
-- TOC entry 233 (class 1259 OID 34555)
-- Name: crimes; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.crimes (
    crime_id character varying(50) NOT NULL,
    ps_code character varying(20) NOT NULL,
    fir_num character varying(50) NOT NULL,
    fir_reg_num character varying(50) NOT NULL,
    fir_type character varying(50),
    acts_sections text,
    fir_date timestamp without time zone,
    case_status character varying(100),
    major_head character varying(100),
    minor_head character varying(255),
    crime_type character varying(100),
    io_name character varying(255),
    io_rank character varying(100),
    brief_facts text,
    date_created timestamp without time zone,
    date_modified timestamp without time zone,
    fir_copy character varying(50),
    complainant_id character varying(50),
    court_name character varying(255),
    io_mobile character varying(20),
    gd_entry_date timestamp without time zone,
    gd_entry_num character varying(50),
    gd_entry_type character varying(50),
    occurrence_from_date timestamp without time zone,
    occurrence_prior_to_date timestamp without time zone,
    occurrence_to_date timestamp without time zone,
    poo_area_mandal character varying(255),
    poo_beat_no character varying(50),
    poo_district character varying(100),
    poo_house_no character varying(100),
    poo_jurisdiction_ps character varying(255),
    poo_landmark_milestone character varying(255),
    poo_latitude character varying(50),
    poo_limits character varying(255),
    poo_longitude character varying(50),
    poo_pin_code character varying(20),
    poo_state_ut character varying(100),
    poo_street_road_no character varying(255),
    poo_ward_colony character varying(255),
    additional_json_data jsonb
);


ALTER TABLE public.crimes OWNER TO cctns_prod;

--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE crimes; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.crimes IS 'Crime/FIR records registered at police stations';


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN crimes.brief_facts; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.crimes.brief_facts IS 'Detailed description of the crime incident';


--
-- TOC entry 234 (class 1259 OID 34560)
-- Name: disposal; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.disposal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    crime_id character varying(50) NOT NULL,
    disposal_type text,
    disposed_at timestamp with time zone,
    disposal text,
    case_status text,
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.disposal OWNER TO cctns_prod;

--
-- TOC entry 235 (class 1259 OID 34566)
-- Name: etl_run_state; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.etl_run_state (
    module_name character varying(100) NOT NULL,
    last_successful_end character varying(30) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.etl_run_state OWNER TO cctns_prod;

--
-- TOC entry 236 (class 1259 OID 34570)
-- Name: files; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_type public.source_type_enum NOT NULL,
    source_field public.source_field_enum NOT NULL,
    parent_id character varying(255) NOT NULL,
    file_id uuid,
    has_field boolean DEFAULT true,
    is_empty boolean DEFAULT false,
    file_path character varying(500),
    file_url character varying(1000),
    file_index integer,
    identity_type character varying(255),
    identity_number character varying(255),
    notes text,
    downloaded_at timestamp without time zone,
    is_downloaded boolean DEFAULT false,
    download_error text,
    download_attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.files OWNER TO cctns_prod;

--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE files; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.files IS 'Stores file references (UUIDs) from various sources (crimes, interrogations, properties, persons)';


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.source_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.source_type IS 'Type of source: crime, interrogation, property, or person';


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.source_field; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.source_field IS 'Field name from source: FIR_COPY, MEDIA, INTERROGATION_REPORT, DOPAMS_DATA, IDENTITY_DETAILS';


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.parent_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.parent_id IS 'ID of the parent record (crime_id, interrogation_report_id, property_id, or person_id)';


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.file_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_id IS 'The actual file UUID that can be used to fetch the file via API. NULL if field exists but has no file.';


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.has_field; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.has_field IS 'TRUE if the field exists in API response, FALSE if field is missing';


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.is_empty; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.is_empty IS 'TRUE if field exists but is null or empty array';


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.file_path; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_path IS 'Relative file path on Tomcat server (auto-generated, NULL if file_id is NULL)';


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.file_url; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_url IS 'Full file URL on Tomcat server (auto-generated, NULL if file_id is NULL)';


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.file_index; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_index IS 'Index position in array (for MEDIA arrays with multiple files)';


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.identity_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.identity_type IS 'For IDENTITY_DETAILS: type of identity document (Aadhar Card, Passport, etc.)';


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.identity_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.identity_number IS 'For IDENTITY_DETAILS: identity document number';


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.downloaded_at; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.downloaded_at IS 'Timestamp when file was successfully downloaded to media server';


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.is_downloaded; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.is_downloaded IS 'Flag indicating if file has been successfully downloaded to media server';


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.download_error; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.download_error IS 'Error message if file download failed';


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.download_attempts; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.download_attempts IS 'Number of download attempts made';


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN files.created_at; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.created_at IS 'Timestamp from API (DATE_CREATED or DATE_MODIFIED)';


--
-- TOC entry 237 (class 1259 OID 34581)
-- Name: files_summary; Type: VIEW; Schema: public; Owner: cctns_prod
--

CREATE VIEW public.files_summary AS
 SELECT source_type,
    source_field,
    count(DISTINCT parent_id) AS parent_records_count,
    count(*) AS total_files,
    count(DISTINCT file_id) AS unique_files
   FROM public.files
  GROUP BY source_type, source_field;


ALTER VIEW public.files_summary OWNER TO cctns_prod;

--
-- TOC entry 238 (class 1259 OID 34585)
-- Name: fpb_accused; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.fpb_accused (
    fpb_accused_id bigint NOT NULL,
    crime_id character varying(50),
    person_id character varying(50),
    fir_num character varying(50) NOT NULL,
    ps_code character varying(20) NOT NULL,
    age text,
    alias text,
    caste text,
    cc_kd_dc_no text,
    confession_statement text,
    date_fingerprinted timestamp without time zone,
    date_of_arrest timestamp without time zone,
    dob date,
    father_husband_name text,
    fir_reg_num text,
    fp_unit text,
    full_name text,
    mo text,
    nationality text,
    occupation text,
    phone_number text,
    place_of_birth text,
    property_recovered text,
    ps_where_fps_obtained text,
    religion text,
    remarks text,
    sex text,
    slip_type text,
    surname text,
    aadhaar_or_other_id_number text,
    aadhaar_or_other_id_type text,
    arrest_details_crime_no text,
    arrest_details_crime_year text,
    arrest_details_district text,
    arrest_details_ps_name text,
    arrest_details_section_of_law text,
    arrest_details_state_of_arrest text,
    permanent_address_address text,
    permanent_address_district text,
    permanent_address_state_ut text,
    present_address_address text,
    present_address_district text,
    present_address_state_ut text,
    pf_beard text,
    pf_chin text,
    pf_complexion_of_face text,
    pf_ear text,
    pf_eyebrows text,
    pf_forehead text,
    pf_hair text,
    pf_hair_color text,
    pf_height text,
    pf_jaws text,
    pf_lips text,
    pf_moustaches text,
    pf_mouth text,
    pf_neck text,
    pf_nose text,
    pf_shape_of_face text,
    pf_weight text,
    date_fetched timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fpb_accused OWNER TO cctns_prod;

--
-- TOC entry 239 (class 1259 OID 34591)
-- Name: fpb_accused_fpb_accused_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.fpb_accused_fpb_accused_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fpb_accused_fpb_accused_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 239
-- Name: fpb_accused_fpb_accused_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.fpb_accused_fpb_accused_id_seq OWNED BY public.fpb_accused.fpb_accused_id;


--
-- TOC entry 240 (class 1259 OID 34592)
-- Name: fpb_additional_crimes; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.fpb_additional_crimes (
    id bigint NOT NULL,
    fpb_accused_id bigint NOT NULL,
    crime_no text,
    district text,
    police_station text,
    section_of_law text,
    state text,
    year text
);


ALTER TABLE public.fpb_additional_crimes OWNER TO cctns_prod;

--
-- TOC entry 241 (class 1259 OID 34597)
-- Name: fpb_additional_crimes_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.fpb_additional_crimes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fpb_additional_crimes_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 241
-- Name: fpb_additional_crimes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.fpb_additional_crimes_id_seq OWNED BY public.fpb_additional_crimes.id;


--
-- TOC entry 242 (class 1259 OID 34598)
-- Name: fsl_case_property; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.fsl_case_property (
    case_property_id character varying(255) NOT NULL,
    case_type character varying(100),
    crime_id character varying(50) NOT NULL,
    mo_id character varying(255),
    status character varying(100),
    send_date timestamp with time zone,
    fsl_date timestamp with time zone,
    date_disposal timestamp with time zone,
    release_date timestamp with time zone,
    return_date timestamp with time zone,
    date_custody timestamp with time zone,
    date_sent_to_expert timestamp with time zone,
    court_order_date timestamp with time zone,
    date_created timestamp with time zone,
    date_modified timestamp with time zone,
    forwarding_through character varying(255),
    court_name character varying(500),
    fsl_court_name character varying(500),
    cpr_court_name character varying(500),
    court_order_number character varying(255),
    fsl_no character varying(255),
    fsl_request_id character varying(255),
    report_received boolean,
    opinion text,
    opinion_furnished character varying(255),
    strength_of_evidence character varying(255),
    expert_type character varying(255),
    other_expert_type character varying(255),
    cpr_no character varying(255),
    direction_by_court text,
    details_disposal text,
    place_disposal character varying(500),
    release_order_no character varying(255),
    place_custody character varying(500),
    assign_custody character varying(255),
    property_received_back boolean
);


ALTER TABLE public.fsl_case_property OWNER TO cctns_prod;

--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE fsl_case_property; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.fsl_case_property IS 'Main table storing case property records from DOPAMS API';


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.case_property_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.case_property_id IS 'Primary key from API (CASE_PROPERTY_ID) - MongoDB ObjectId (24 hex characters)';


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.crime_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.crime_id IS 'Reference to crime/case (CRIME_ID) - Foreign key to crimes table';


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.mo_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.mo_id IS 'Material Object ID (MO_ID)';


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.status IS 'Current status (e.g., Send To FSL, Send To Court)';


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.date_created; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.date_created IS 'Record creation timestamp from API (DATE_CREATED)';


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.date_modified; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.date_modified IS 'Record modification timestamp from API (DATE_MODIFIED)';


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.fsl_no; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.fsl_no IS 'FSL case number';


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.report_received; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.report_received IS 'Whether FSL report has been received';


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 242
-- Name: COLUMN fsl_case_property.property_received_back; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.property_received_back IS 'Whether property has been received back';


--
-- TOC entry 243 (class 1259 OID 34603)
-- Name: hierarchy; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.hierarchy (
    ps_code character varying(20) NOT NULL,
    ps_name character varying(255) NOT NULL,
    circle_code character varying(20),
    circle_name character varying(255),
    sdpo_code character varying(20),
    sdpo_name character varying(255),
    sub_zone_code character varying(20),
    sub_zone_name character varying(255),
    dist_code character varying(20),
    dist_name character varying(255),
    range_code character varying(20),
    range_name character varying(255),
    zone_code character varying(20),
    zone_name character varying(255),
    adg_code character varying(20),
    adg_name character varying(255),
    date_created timestamp without time zone,
    date_modified timestamp without time zone
);


ALTER TABLE public.hierarchy OWNER TO cctns_prod;

--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE hierarchy; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.hierarchy IS 'Police organizational hierarchy from ADG to Police Station in single table';


--
-- TOC entry 244 (class 1259 OID 34608)
-- Name: interrogation_reports; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.interrogation_reports (
    interrogation_report_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    person_id character varying(50),
    physical_beard character varying(100),
    physical_build character varying(100),
    physical_burn_marks character varying(100),
    physical_color character varying(100),
    physical_deformities_or_peculiarities character varying(255),
    physical_deformities character varying(255),
    physical_ear character varying(100),
    physical_eyes character varying(100),
    physical_face character varying(100),
    physical_hair character varying(100),
    physical_height character varying(100),
    physical_identification_marks text,
    physical_language_or_dialect text[],
    physical_leucoderma character varying(100),
    physical_mole character varying(100),
    physical_mustache character varying(100),
    physical_nose character varying(100),
    physical_scar character varying(100),
    physical_tattoo character varying(100),
    physical_teeth character varying(100),
    socio_living_status character varying(100),
    socio_marital_status character varying(100),
    socio_education character varying(255),
    socio_occupation character varying(255),
    socio_income_group character varying(255),
    offence_time character varying(255),
    other_offence_time character varying(255),
    share_of_amount_spent character varying(255),
    other_share_of_amount_spent character varying(255),
    share_remarks text,
    is_in_jail boolean,
    from_where_sent_in_jail text,
    in_jail_crime_num character varying(255),
    in_jail_dist_unit character varying(255),
    is_on_bail boolean,
    from_where_sent_on_bail text,
    on_bail_crime_num character varying(255),
    date_of_bail date,
    is_absconding boolean,
    wanted_in_police_station character varying(255),
    absconding_crime_num character varying(255),
    is_normal_life boolean,
    eking_livelihood_by_labor_work text,
    is_rehabilitated boolean,
    rehabilitation_details text,
    is_dead boolean,
    death_details text,
    is_facing_trial boolean,
    facing_trial_ps_name character varying(255),
    facing_trial_crime_num character varying(255),
    other_regular_habits text,
    other_indulgence_before_offence text,
    time_since_modus_operandi text,
    date_created timestamp without time zone,
    date_modified timestamp without time zone
);


ALTER TABLE public.interrogation_reports OWNER TO cctns_prod;

--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE interrogation_reports; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.interrogation_reports IS 'Main table storing Interrogation Report (IR) data. All common fields are stored as columns for easy querying.';


--
-- TOC entry 245 (class 1259 OID 34613)
-- Name: ir_associate_details; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_associate_details (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    person_id character varying(50),
    gang character varying(255),
    relation text
);


ALTER TABLE public.ir_associate_details OWNER TO cctns_prod;

--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE ir_associate_details; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_associate_details IS 'Associate information for each IR record. One record per associate.';


--
-- TOC entry 246 (class 1259 OID 34618)
-- Name: ir_associate_details_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_associate_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_associate_details_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 246
-- Name: ir_associate_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_associate_details_id_seq OWNED BY public.ir_associate_details.id;


--
-- TOC entry 247 (class 1259 OID 34619)
-- Name: ir_consumer_details; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_consumer_details (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    consumer_person_id character varying(50),
    place_of_consumption text,
    other_sources text,
    other_sources_phone_no character varying(20),
    aadhar_card_number character varying(20),
    aadhar_card_number_phone_no character varying(20)
);


ALTER TABLE public.ir_consumer_details OWNER TO cctns_prod;

--
-- TOC entry 248 (class 1259 OID 34624)
-- Name: ir_conviction_acquittal; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_conviction_acquittal (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    crime_num text,
    jurisdiction_ps text,
    court_name text,
    judge_name text,
    law_section text,
    verdict text,
    verdict_date date,
    reason_if_acquitted text,
    conviction_remarks text,
    fine_amount_in_inr numeric,
    sentence_if_convicted text,
    appeal_status text,
    appeal_court text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_conviction_acquittal OWNER TO cctns_prod;

--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE ir_conviction_acquittal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_conviction_acquittal IS 'Conviction/acquittal details for each IR record. One record per case verdict entry.';


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.crime_num IS 'Associated crime number';


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.court_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.court_name IS 'Court name where verdict was delivered';


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.verdict; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.verdict IS 'Verdict (Convicted, Acquitted, Discharged, etc.)';


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.verdict_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.verdict_date IS 'Date of verdict';


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.reason_if_acquitted; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.reason_if_acquitted IS 'Reason for acquittal if applicable';


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.sentence_if_convicted; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.sentence_if_convicted IS 'Details of sentence if convicted';


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ir_conviction_acquittal.appeal_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.appeal_status IS 'Status of any appeal (Pending, Dismissed, Allowed, etc.)';


--
-- TOC entry 249 (class 1259 OID 34631)
-- Name: ir_defence_counsel; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_defence_counsel (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    dist_division text,
    ps_code text,
    crime_num text,
    law_section text,
    sc_cc_num text,
    defence_counsel_address text,
    defence_counsel_phone text,
    assistance text,
    defence_counsel_person_id character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_defence_counsel OWNER TO cctns_prod;

--
-- TOC entry 250 (class 1259 OID 34638)
-- Name: ir_dopams_links; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_dopams_links (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    phone_number character varying(20),
    dopams_data text[]
);


ALTER TABLE public.ir_dopams_links OWNER TO cctns_prod;

--
-- TOC entry 251 (class 1259 OID 34643)
-- Name: ir_execution_of_nbw; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_execution_of_nbw (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    nbw_number text,
    issued_date date,
    executed_date date,
    jurisdiction_ps text,
    crime_num text,
    executed_by text,
    place_of_execution text,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_execution_of_nbw OWNER TO cctns_prod;

--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 251
-- Name: TABLE ir_execution_of_nbw; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_execution_of_nbw IS 'Execution of NBW (Non-Bailable Warrant) for each IR record. One record per NBW execution entry.';


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.nbw_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.nbw_number IS 'NBW number/reference';


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.issued_date IS 'Date NBW was issued';


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.executed_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.executed_date IS 'Date NBW was executed';


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.jurisdiction_ps IS 'Police station where executed';


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.crime_num IS 'Associated crime number';


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.executed_by; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.executed_by IS 'Name of officer who executed';


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN ir_execution_of_nbw.place_of_execution; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.place_of_execution IS 'Location of execution';


--
-- TOC entry 252 (class 1259 OID 34650)
-- Name: ir_family_history; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_family_history (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    person_id character varying(50),
    relation text,
    family_member_peculiarity text,
    criminal_background boolean DEFAULT false,
    is_alive boolean DEFAULT true,
    family_stay_together boolean DEFAULT true
);


ALTER TABLE public.ir_family_history OWNER TO cctns_prod;

--
-- TOC entry 253 (class 1259 OID 34658)
-- Name: ir_financial_history; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_financial_history (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    account_holder_person_id character varying(50),
    pan_no character varying(50),
    upi_id character varying(255),
    name_of_bank character varying(255),
    account_number text,
    branch_name character varying(255),
    ifsc_code character varying(50),
    immovable_property_acquired text,
    movable_property_acquired text
);


ALTER TABLE public.ir_financial_history OWNER TO cctns_prod;

--
-- TOC entry 254 (class 1259 OID 34663)
-- Name: ir_indulgance_before_offence; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_indulgance_before_offence (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    indulgance text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ir_indulgance_before_offence OWNER TO cctns_prod;

--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE ir_indulgance_before_offence; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_indulgance_before_offence IS 'Substances/habits indulged in before offense for each IR record. One record per indulgance entry (junction table for INDULGANCE_BEFORE_OFFENCE array).';


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 254
-- Name: COLUMN ir_indulgance_before_offence.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_indulgance_before_offence.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 254
-- Name: COLUMN ir_indulgance_before_offence.indulgance; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_indulgance_before_offence.indulgance IS 'Type of indulgance (e.g., alcohol, drugs, etc.)';


--
-- TOC entry 255 (class 1259 OID 34669)
-- Name: ir_interrogation_report_refs; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_interrogation_report_refs (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    report_ref_id text NOT NULL
);


ALTER TABLE public.ir_interrogation_report_refs OWNER TO cctns_prod;

--
-- TOC entry 256 (class 1259 OID 34674)
-- Name: ir_jail_sentence; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_jail_sentence (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    crime_num text,
    jurisdiction_ps text,
    law_section text,
    sentence_type text,
    sentence_duration_in_months integer,
    sentence_start_date date,
    sentence_end_date date,
    sentence_amount_in_inr numeric,
    jail_name text,
    date_of_jail_entry date,
    date_of_jail_release date,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_jail_sentence OWNER TO cctns_prod;

--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE ir_jail_sentence; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_jail_sentence IS 'Jail sentence details for each IR record. One record per sentence entry.';


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.crime_num IS 'Associated crime number';


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.sentence_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_type IS 'Type of sentence (RI, SI, etc.)';


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.sentence_duration_in_months; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_duration_in_months IS 'Duration in months';


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.sentence_start_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_start_date IS 'When sentence started';


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.sentence_end_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_end_date IS 'When sentence ended';


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.sentence_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_amount_in_inr IS 'Fine amount in INR if applicable';


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.jail_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.jail_name IS 'Name of jail where served';


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.date_of_jail_entry; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.date_of_jail_entry IS 'When admitted to jail';


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN ir_jail_sentence.date_of_jail_release; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.date_of_jail_release IS 'When released from jail';


--
-- TOC entry 257 (class 1259 OID 34681)
-- Name: ir_local_contacts; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_local_contacts (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    person_id character varying(50),
    town character varying(255),
    address text,
    jurisdiction_ps text
);


ALTER TABLE public.ir_local_contacts OWNER TO cctns_prod;

--
-- TOC entry 258 (class 1259 OID 34686)
-- Name: ir_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_media (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    media_id text NOT NULL
);


ALTER TABLE public.ir_media OWNER TO cctns_prod;

--
-- TOC entry 259 (class 1259 OID 34691)
-- Name: ir_modus_operandi; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_modus_operandi (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    crime_head character varying(255),
    crime_sub_head character varying(255),
    modus_operandi text
);


ALTER TABLE public.ir_modus_operandi OWNER TO cctns_prod;

--
-- TOC entry 260 (class 1259 OID 34696)
-- Name: ir_new_gang_formation; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_new_gang_formation (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    gang_name text,
    gang_formation_date date,
    number_of_members integer,
    leader_name text,
    leader_person_id character varying(50),
    gang_objective text,
    criminal_history text,
    jurisdiction_ps text,
    active text,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_new_gang_formation OWNER TO cctns_prod;

--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE ir_new_gang_formation; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_new_gang_formation IS 'New gang formation details for each IR record. One record per gang entry.';


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.gang_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_name IS 'Name of the gang';


--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.gang_formation_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_formation_date IS 'When gang was formed';


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.number_of_members; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.number_of_members IS 'Number of members';


--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.leader_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.leader_name IS 'Name of gang leader';


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.leader_person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.leader_person_id IS 'Reference to person_id if leader is in DOPAMS';


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.gang_objective; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_objective IS 'Stated objective of gang';


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.criminal_history; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.criminal_history IS 'Known criminal activities';


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN ir_new_gang_formation.active; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.active IS 'Whether gang is still active';


--
-- TOC entry 261 (class 1259 OID 34703)
-- Name: ir_pending_nbw; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_pending_nbw (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    nbw_number text,
    issued_date date,
    jurisdiction_ps text,
    crime_num text,
    reason_for_pending text,
    expected_execution_date date,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_pending_nbw OWNER TO cctns_prod;

--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE ir_pending_nbw; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_pending_nbw IS 'Pending NBW (Non-Bailable Warrant) for each IR record. One record per pending NBW entry.';


--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.nbw_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.nbw_number IS 'NBW number/reference';


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.issued_date IS 'Date NBW was issued';


--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.jurisdiction_ps IS 'Police station where issued';


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.crime_num IS 'Associated crime number';


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.reason_for_pending; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.reason_for_pending IS 'Reason why NBW is still pending';


--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN ir_pending_nbw.expected_execution_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.expected_execution_date IS 'Expected date of execution';


--
-- TOC entry 262 (class 1259 OID 34710)
-- Name: ir_previous_offences_confessed; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_previous_offences_confessed (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    arrest_date date,
    arrested_by character varying(255),
    arrest_place text,
    crime_num text,
    dist_unit_division character varying(255),
    gang_member character varying(255),
    interrogated_by character varying(255),
    law_section character varying(255),
    others_identify text,
    property_recovered text,
    property_stolen text,
    ps_code text,
    remarks text,
    conviction_status character varying(100),
    bail_status character varying(100),
    court_name character varying(500),
    judge_name character varying(255)
);


ALTER TABLE public.ir_previous_offences_confessed OWNER TO cctns_prod;

--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN ir_previous_offences_confessed.conviction_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.conviction_status IS 'Status of conviction (if relevant to the offense)';


--
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN ir_previous_offences_confessed.bail_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.bail_status IS 'Bail status during this offense';


--
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN ir_previous_offences_confessed.court_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.court_name IS 'Court handling the case';


--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN ir_previous_offences_confessed.judge_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.judge_name IS 'Judge handling the case';


--
-- TOC entry 263 (class 1259 OID 34715)
-- Name: ir_property_disposal; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_property_disposal (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    mode_of_disposal text,
    buyer_name text,
    sold_amount_in_inr numeric,
    location_of_disposal text,
    date_of_disposal date,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_property_disposal OWNER TO cctns_prod;

--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE ir_property_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_property_disposal IS 'Property disposal details for each IR record. One record per disposal entry.';


--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.mode_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.mode_of_disposal IS 'How property was disposed (sold, donated, etc.)';


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.buyer_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.buyer_name IS 'Name of buyer or recipient';


--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.sold_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.sold_amount_in_inr IS 'Amount in INR if sold';


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.location_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.location_of_disposal IS 'Location where property was disposed';


--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN ir_property_disposal.date_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.date_of_disposal IS 'Date of disposal';


--
-- TOC entry 264 (class 1259 OID 34722)
-- Name: ir_regular_habits; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_regular_habits (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    habit character varying(255) NOT NULL
);


ALTER TABLE public.ir_regular_habits OWNER TO cctns_prod;

--
-- TOC entry 265 (class 1259 OID 34725)
-- Name: ir_regularization_transit_warrants; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_regularization_transit_warrants (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    warrant_number text,
    warrant_type text,
    issued_date date,
    jurisdiction_ps text,
    crime_num text,
    status text,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_regularization_transit_warrants OWNER TO cctns_prod;

--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE ir_regularization_transit_warrants; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_regularization_transit_warrants IS 'Regularization of transit warrants for each IR record. One record per warrant entry.';


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.warrant_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.warrant_number IS 'Warrant number/reference';


--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.warrant_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.warrant_type IS 'Type of warrant (NBW, transit, etc.)';


--
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.issued_date IS 'Date warrant was issued';


--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.jurisdiction_ps IS 'Police station/jurisdiction';


--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.crime_num IS 'Associated crime number';


--
-- TOC entry 4440 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN ir_regularization_transit_warrants.status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.status IS 'Current status (pending, executed, withdrawn, etc.)';


--
-- TOC entry 266 (class 1259 OID 34732)
-- Name: ir_shelter; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_shelter (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    preparation_of_offence text,
    after_offence text,
    regular_residency character varying(255),
    remarks text,
    other_regular_residency text
);


ALTER TABLE public.ir_shelter OWNER TO cctns_prod;

--
-- TOC entry 267 (class 1259 OID 34737)
-- Name: ir_sim_details; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_sim_details (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    phone_number character varying(20),
    sdr text,
    imei character varying(50),
    true_caller_name character varying(255),
    person_id character varying(50)
);


ALTER TABLE public.ir_sim_details OWNER TO cctns_prod;

--
-- TOC entry 268 (class 1259 OID 34742)
-- Name: ir_sureties; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_sureties (
    id bigint NOT NULL,
    interrogation_report_id character varying(50),
    surety_person_id character varying(50),
    surety_name text,
    relation_to_accused text,
    occupation text,
    aadhar_number text,
    pan_number text,
    house_no text,
    street_road_no text,
    locality_village text,
    area_mandal text,
    district text,
    state_ut text,
    pin_code text,
    phone_number text,
    surety_amount_in_inr numeric,
    date_of_surety date,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ir_sureties OWNER TO cctns_prod;

--
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE ir_sureties; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_sureties IS 'Surety information for bail for each IR record. One record per surety entry.';


--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.surety_person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_person_id IS 'Reference to person_id if surety is in DOPAMS';


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.surety_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_name IS 'Name of surety';


--
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.relation_to_accused; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.relation_to_accused IS 'Relationship to accused (friend, family, etc.)';


--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.occupation; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.occupation IS 'Occupation of surety';


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.surety_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_amount_in_inr IS 'Amount of surety in INR';


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN ir_sureties.date_of_surety; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.date_of_surety IS 'Date surety was provided';


--
-- TOC entry 269 (class 1259 OID 34749)
-- Name: ir_types_of_drugs; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_types_of_drugs (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    type_of_drug text,
    quantity character varying(255),
    purchase_amount_in_inr text,
    mode_of_payment text,
    mode_of_transport text,
    supplier_person_id character varying(50),
    receivers_person_id character varying(50)
);


ALTER TABLE public.ir_types_of_drugs OWNER TO cctns_prod;

--
-- TOC entry 270 (class 1259 OID 34754)
-- Name: ir_child_table_coverage; Type: VIEW; Schema: public; Owner: cctns_prod
--

CREATE VIEW public.ir_child_table_coverage AS
 SELECT 'REGULAR_HABITS'::text AS array_field,
    count(DISTINCT rh.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_regular_habits rh
UNION ALL
 SELECT 'TIMES_OF_DRUGS'::text AS array_field,
    count(DISTINCT td.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_types_of_drugs td
UNION ALL
 SELECT 'FAMILY_HISTORY'::text AS array_field,
    count(DISTINCT fh.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_family_history fh
UNION ALL
 SELECT 'LOCAL_CONTACTS'::text AS array_field,
    count(DISTINCT lc.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_local_contacts lc
UNION ALL
 SELECT 'MODUS_OPERANDI'::text AS array_field,
    count(DISTINCT mo.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_modus_operandi mo
UNION ALL
 SELECT 'PREVIOUS_OFFENCES_CONFESSED'::text AS array_field,
    count(DISTINCT po.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_previous_offences_confessed po
UNION ALL
 SELECT 'DEFENCE_COUNSEL'::text AS array_field,
    count(DISTINCT dc.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_defence_counsel dc
UNION ALL
 SELECT 'ASSOCIATE_DETAILS'::text AS array_field,
    count(DISTINCT ad.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_associate_details ad
UNION ALL
 SELECT 'SHELTER'::text AS array_field,
    count(DISTINCT sh.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_shelter sh
UNION ALL
 SELECT 'SIM_DETAILS'::text AS array_field,
    count(DISTINCT sd.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_sim_details sd
UNION ALL
 SELECT 'FINANCIAL_HISTORY'::text AS array_field,
    count(DISTINCT fh.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_financial_history fh
UNION ALL
 SELECT 'CONSUMER_DETAILS'::text AS array_field,
    count(DISTINCT cd.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_consumer_details cd
UNION ALL
 SELECT 'MEDIA'::text AS array_field,
    count(DISTINCT m.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_media m
UNION ALL
 SELECT 'INTERROGATION_REPORT_REFS'::text AS array_field,
    count(DISTINCT irr.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_interrogation_report_refs irr
UNION ALL
 SELECT 'DOPAMS_LINKS'::text AS array_field,
    count(DISTINCT dl.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_dopams_links dl
UNION ALL
 SELECT 'INDULGANCE_BEFORE_OFFENCE'::text AS array_field,
    count(DISTINCT ifo.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_indulgance_before_offence ifo
UNION ALL
 SELECT 'PROPERTY_DISPOSAL'::text AS array_field,
    count(DISTINCT ipd.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_property_disposal ipd
UNION ALL
 SELECT 'REGULARIZATION_TRANSIT_WARRANTS'::text AS array_field,
    count(DISTINCT irtw.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_regularization_transit_warrants irtw
UNION ALL
 SELECT 'EXECUTION_OF_NBW'::text AS array_field,
    count(DISTINCT ien.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_execution_of_nbw ien
UNION ALL
 SELECT 'PENDING_NBW'::text AS array_field,
    count(DISTINCT ipn.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_pending_nbw ipn
UNION ALL
 SELECT 'SURETIES'::text AS array_field,
    count(DISTINCT ise.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_sureties ise
UNION ALL
 SELECT 'JAIL_SENTENCE'::text AS array_field,
    count(DISTINCT ijs.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_jail_sentence ijs
UNION ALL
 SELECT 'NEW_GANG_FORMATION'::text AS array_field,
    count(DISTINCT ingf.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_new_gang_formation ingf
UNION ALL
 SELECT 'CONVICTION_ACQUITTAL'::text AS array_field,
    count(DISTINCT ica.interrogation_report_id) AS ir_records_with_data,
    count(*) AS total_entries
   FROM public.ir_conviction_acquittal ica
  ORDER BY 1;


ALTER VIEW public.ir_child_table_coverage OWNER TO cctns_prod;

--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 270
-- Name: VIEW ir_child_table_coverage; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON VIEW public.ir_child_table_coverage IS 'Shows data coverage for all IR related arrays - helps identify which fields are being populated';


--
-- TOC entry 271 (class 1259 OID 34759)
-- Name: ir_consumer_details_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_consumer_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_consumer_details_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 271
-- Name: ir_consumer_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_consumer_details_id_seq OWNED BY public.ir_consumer_details.id;


--
-- TOC entry 272 (class 1259 OID 34760)
-- Name: ir_conviction_acquittal_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_conviction_acquittal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_conviction_acquittal_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 272
-- Name: ir_conviction_acquittal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_conviction_acquittal_id_seq OWNED BY public.ir_conviction_acquittal.id;


--
-- TOC entry 273 (class 1259 OID 34761)
-- Name: ir_defence_counsel_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_defence_counsel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_defence_counsel_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 273
-- Name: ir_defence_counsel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_defence_counsel_id_seq OWNED BY public.ir_defence_counsel.id;


--
-- TOC entry 274 (class 1259 OID 34762)
-- Name: ir_dopams_links_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_dopams_links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_dopams_links_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 274
-- Name: ir_dopams_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_dopams_links_id_seq OWNED BY public.ir_dopams_links.id;


--
-- TOC entry 275 (class 1259 OID 34763)
-- Name: ir_execution_of_nbw_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_execution_of_nbw_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_execution_of_nbw_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 275
-- Name: ir_execution_of_nbw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_execution_of_nbw_id_seq OWNED BY public.ir_execution_of_nbw.id;


--
-- TOC entry 276 (class 1259 OID 34764)
-- Name: ir_family_history_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_family_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_family_history_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 276
-- Name: ir_family_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_family_history_id_seq OWNED BY public.ir_family_history.id;


--
-- TOC entry 277 (class 1259 OID 34765)
-- Name: ir_field_persistence_check; Type: VIEW; Schema: public; Owner: cctns_prod
--

CREATE VIEW public.ir_field_persistence_check AS
 SELECT 'INTERROGATION_REPORT_ID'::text AS api_field,
    'interrogation_report_id'::text AS db_column,
    count(ir.interrogation_report_id) AS records_with_value,
    count(NULLIF((ir.interrogation_report_id)::text, ''::text)) AS non_null_count
   FROM public.interrogation_reports ir
UNION ALL
 SELECT 'CRIME_ID'::text AS api_field,
    'crime_id'::text AS db_column,
    count(ir.crime_id) AS records_with_value,
    count(NULLIF((ir.crime_id)::text, ''::text)) AS non_null_count
   FROM public.interrogation_reports ir
UNION ALL
 SELECT 'PERSON_ID'::text AS api_field,
    'person_id'::text AS db_column,
    count(ir.person_id) AS records_with_value,
    count(NULLIF((ir.person_id)::text, ''::text)) AS non_null_count
   FROM public.interrogation_reports ir
UNION ALL
 SELECT 'INDULGANCE_BEFORE_OFFENCE'::text AS api_field,
    'ir_indulgance_before_offence'::text AS db_column,
    count(DISTINCT ib.interrogation_report_id) AS records_with_value,
    count(ib.indulgance) AS non_null_count
   FROM public.ir_indulgance_before_offence ib
UNION ALL
 SELECT 'PROPERTY_DISPOSAL'::text AS api_field,
    'ir_property_disposal'::text AS db_column,
    count(DISTINCT ipd.interrogation_report_id) AS records_with_value,
    count(ipd.mode_of_disposal) AS non_null_count
   FROM public.ir_property_disposal ipd
UNION ALL
 SELECT 'REGULARIZATION_OF_TRANSIT_WARRANTS'::text AS api_field,
    'ir_regularization_transit_warrants'::text AS db_column,
    count(DISTINCT irtw.interrogation_report_id) AS records_with_value,
    count(irtw.warrant_number) AS non_null_count
   FROM public.ir_regularization_transit_warrants irtw
UNION ALL
 SELECT 'EXECUTION_OF_NBW'::text AS api_field,
    'ir_execution_of_nbw'::text AS db_column,
    count(DISTINCT ien.interrogation_report_id) AS records_with_value,
    count(ien.nbw_number) AS non_null_count
   FROM public.ir_execution_of_nbw ien
UNION ALL
 SELECT 'PENDING_NBW'::text AS api_field,
    'ir_pending_nbw'::text AS db_column,
    count(DISTINCT ipn.interrogation_report_id) AS records_with_value,
    count(ipn.nbw_number) AS non_null_count
   FROM public.ir_pending_nbw ipn
UNION ALL
 SELECT 'SURETIES'::text AS api_field,
    'ir_sureties'::text AS db_column,
    count(DISTINCT ise.interrogation_report_id) AS records_with_value,
    count(ise.surety_name) AS non_null_count
   FROM public.ir_sureties ise
UNION ALL
 SELECT 'JAIL_SENTENCE'::text AS api_field,
    'ir_jail_sentence'::text AS db_column,
    count(DISTINCT ijs.interrogation_report_id) AS records_with_value,
    count(ijs.sentence_type) AS non_null_count
   FROM public.ir_jail_sentence ijs
UNION ALL
 SELECT 'NEW_GANG_FORMATION'::text AS api_field,
    'ir_new_gang_formation'::text AS db_column,
    count(DISTINCT ingf.interrogation_report_id) AS records_with_value,
    count(ingf.gang_name) AS non_null_count
   FROM public.ir_new_gang_formation ingf
UNION ALL
 SELECT 'CONVICTION_ACQUITTAL'::text AS api_field,
    'ir_conviction_acquittal'::text AS db_column,
    count(DISTINCT ica.interrogation_report_id) AS records_with_value,
    count(ica.verdict) AS non_null_count
   FROM public.ir_conviction_acquittal ica;


ALTER VIEW public.ir_field_persistence_check OWNER TO cctns_prod;

--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 277
-- Name: VIEW ir_field_persistence_check; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON VIEW public.ir_field_persistence_check IS 'Validates API field to DB persistence mapping - shows which fields are being stored and frequency of non-null values';


--
-- TOC entry 278 (class 1259 OID 34770)
-- Name: ir_financial_history_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_financial_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_financial_history_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 278
-- Name: ir_financial_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_financial_history_id_seq OWNED BY public.ir_financial_history.id;


--
-- TOC entry 279 (class 1259 OID 34771)
-- Name: ir_indulgance_before_offence_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_indulgance_before_offence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_indulgance_before_offence_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 279
-- Name: ir_indulgance_before_offence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_indulgance_before_offence_id_seq OWNED BY public.ir_indulgance_before_offence.id;


--
-- TOC entry 280 (class 1259 OID 34772)
-- Name: ir_interrogation_report_refs_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_interrogation_report_refs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_interrogation_report_refs_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 280
-- Name: ir_interrogation_report_refs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_interrogation_report_refs_id_seq OWNED BY public.ir_interrogation_report_refs.id;


--
-- TOC entry 281 (class 1259 OID 34773)
-- Name: ir_jail_sentence_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_jail_sentence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_jail_sentence_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 281
-- Name: ir_jail_sentence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_jail_sentence_id_seq OWNED BY public.ir_jail_sentence.id;


--
-- TOC entry 282 (class 1259 OID 34774)
-- Name: ir_local_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_local_contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_local_contacts_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 282
-- Name: ir_local_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_local_contacts_id_seq OWNED BY public.ir_local_contacts.id;


--
-- TOC entry 283 (class 1259 OID 34775)
-- Name: ir_media_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_media_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 283
-- Name: ir_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_media_id_seq OWNED BY public.ir_media.id;


--
-- TOC entry 284 (class 1259 OID 34776)
-- Name: ir_modus_operandi_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_modus_operandi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_modus_operandi_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 284
-- Name: ir_modus_operandi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_modus_operandi_id_seq OWNED BY public.ir_modus_operandi.id;


--
-- TOC entry 285 (class 1259 OID 34777)
-- Name: ir_new_gang_formation_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_new_gang_formation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_new_gang_formation_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 285
-- Name: ir_new_gang_formation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_new_gang_formation_id_seq OWNED BY public.ir_new_gang_formation.id;


--
-- TOC entry 286 (class 1259 OID 34778)
-- Name: ir_pending_fk; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_pending_fk (
    id integer NOT NULL,
    ir_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    raw_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    retry_count integer DEFAULT 0,
    last_retry_at timestamp without time zone,
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone
);


ALTER TABLE public.ir_pending_fk OWNER TO cctns_prod;

--
-- TOC entry 287 (class 1259 OID 34786)
-- Name: ir_pending_fk_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_pending_fk_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_pending_fk_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 287
-- Name: ir_pending_fk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_pending_fk_id_seq OWNED BY public.ir_pending_fk.id;


--
-- TOC entry 288 (class 1259 OID 34787)
-- Name: ir_pending_nbw_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_pending_nbw_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_pending_nbw_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 288
-- Name: ir_pending_nbw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_pending_nbw_id_seq OWNED BY public.ir_pending_nbw.id;


--
-- TOC entry 289 (class 1259 OID 34788)
-- Name: ir_previous_offences_confessed_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_previous_offences_confessed_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_previous_offences_confessed_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 289
-- Name: ir_previous_offences_confessed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_previous_offences_confessed_id_seq OWNED BY public.ir_previous_offences_confessed.id;


--
-- TOC entry 290 (class 1259 OID 34789)
-- Name: ir_property_disposal_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_property_disposal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_property_disposal_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 290
-- Name: ir_property_disposal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_property_disposal_id_seq OWNED BY public.ir_property_disposal.id;


--
-- TOC entry 291 (class 1259 OID 34790)
-- Name: ir_regular_habits_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_regular_habits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_regular_habits_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 291
-- Name: ir_regular_habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_regular_habits_id_seq OWNED BY public.ir_regular_habits.id;


--
-- TOC entry 292 (class 1259 OID 34791)
-- Name: ir_regularization_transit_warrants_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_regularization_transit_warrants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_regularization_transit_warrants_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 292
-- Name: ir_regularization_transit_warrants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_regularization_transit_warrants_id_seq OWNED BY public.ir_regularization_transit_warrants.id;


--
-- TOC entry 293 (class 1259 OID 34792)
-- Name: ir_shelter_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_shelter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_shelter_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 293
-- Name: ir_shelter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_shelter_id_seq OWNED BY public.ir_shelter.id;


--
-- TOC entry 294 (class 1259 OID 34793)
-- Name: ir_sim_details_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_sim_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_sim_details_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 294
-- Name: ir_sim_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_sim_details_id_seq OWNED BY public.ir_sim_details.id;


--
-- TOC entry 295 (class 1259 OID 34794)
-- Name: ir_sureties_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_sureties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_sureties_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 295
-- Name: ir_sureties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_sureties_id_seq OWNED BY public.ir_sureties.id;


--
-- TOC entry 296 (class 1259 OID 34795)
-- Name: ir_types_of_drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ir_types_of_drugs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ir_types_of_drugs_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 296
-- Name: ir_types_of_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_types_of_drugs_id_seq OWNED BY public.ir_types_of_drugs.id;


--
-- TOC entry 297 (class 1259 OID 34796)
-- Name: mo_seizure_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.mo_seizure_media (
    id bigint NOT NULL,
    mo_seizure_id character varying(50) NOT NULL,
    media_index integer DEFAULT 0 NOT NULL,
    media_file_id text,
    media_url text,
    media_name text,
    media_category text,
    media_type text,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_modified timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.mo_seizure_media OWNER TO cctns_prod;

--
-- TOC entry 298 (class 1259 OID 34804)
-- Name: mo_seizure_media_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.mo_seizure_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mo_seizure_media_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 298
-- Name: mo_seizure_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.mo_seizure_media_id_seq OWNED BY public.mo_seizure_media.id;


--
-- TOC entry 299 (class 1259 OID 34805)
-- Name: mo_seizures; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.mo_seizures (
    mo_seizure_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    seq_no character varying(50),
    mo_id character varying(50),
    type character varying(100),
    sub_type text,
    description text,
    seized_from text,
    seized_at timestamp with time zone,
    seized_by text,
    strength_of_evidence text,
    pos_address1 text,
    pos_address2 text,
    pos_city text,
    pos_district text,
    pos_pincode text,
    pos_landmark text,
    pos_description text,
    pos_latitude double precision,
    pos_longitude double precision,
    mo_media_url text,
    mo_media_name text,
    mo_media_file_id text,
    mo_media_category text,
    mo_media_type text,
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.mo_seizures OWNER TO cctns_prod;

--
-- TOC entry 300 (class 1259 OID 34810)
-- Name: persons; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.persons (
    person_id character varying(50) NOT NULL,
    name character varying(255),
    surname character varying(255),
    alias character varying(255),
    full_name character varying(500),
    relation_type character varying(50),
    relative_name character varying(255),
    gender character varying(20),
    is_died boolean DEFAULT false,
    date_of_birth date,
    age integer,
    occupation character varying(255),
    education_qualification character varying(255),
    caste character varying(100),
    sub_caste character varying(100),
    religion character varying(100),
    nationality character varying(100),
    designation character varying(255),
    place_of_work character varying(500),
    present_house_no character varying(255),
    present_street_road_no character varying(255),
    present_ward_colony character varying(255),
    present_landmark_milestone character varying(255),
    present_locality_village character varying(255),
    present_area_mandal character varying(255),
    present_district character varying(255),
    present_state_ut character varying(255),
    present_country character varying(255),
    present_residency_type character varying(100),
    present_pin_code character varying(20),
    present_jurisdiction_ps character varying(20),
    phone_number character varying(20),
    country_code character varying(10),
    email_id character varying(255),
    date_created timestamp without time zone,
    date_modified timestamp without time zone,
    raw_full_name character varying(500),
    gender_confidence numeric(4,3),
    gender_source character varying(20),
    phone_numbers character varying(255)
);


ALTER TABLE public.persons OWNER TO cctns_prod;

--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE persons; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.persons IS 'Personal details of individuals (accused, victims, witnesses, etc.)';


--
-- TOC entry 301 (class 1259 OID 34816)
-- Name: ssor_kb; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ssor_kb (
    id integer NOT NULL,
    act_name text NOT NULL,
    section_code text NOT NULL,
    tier text NOT NULL,
    severity_rank integer NOT NULL,
    description text
);


ALTER TABLE public.ssor_kb OWNER TO cctns_prod;

--
-- TOC entry 302 (class 1259 OID 34821)
-- Name: mv_offender_details; Type: MATERIALIZED VIEW; Schema: public; Owner: cctns_prod
--

CREATE MATERIALIZED VIEW public.mv_offender_details AS
 SELECT person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    ( SELECT to_jsonb(a_inner.*) AS to_jsonb
           FROM public.accused a_inner
          WHERE ((a_inner.person_id)::text = (p.person_id)::text)
          ORDER BY a_inner.seq_num DESC
         LIMIT 1) AS latest_physical_features,
    ( SELECT kb.tier
           FROM ((public.accused a_inner
             JOIN public.crimes c_inner ON (((a_inner.crime_id)::text = (c_inner.crime_id)::text)))
             JOIN public.ssor_kb kb ON ((c_inner.acts_sections ~~* (('%'::text || kb.section_code) || '%'::text))))
          WHERE ((a_inner.person_id)::text = (p.person_id)::text)
          ORDER BY kb.severity_rank DESC
         LIMIT 1) AS highest_risk_tier,
    ( SELECT jsonb_agg(to_jsonb(c.*)) AS jsonb_agg
           FROM (public.crimes c
             JOIN public.accused a2 ON (((c.crime_id)::text = (a2.crime_id)::text)))
          WHERE ((a2.person_id)::text = (p.person_id)::text)) AS crimes,
    ( SELECT jsonb_agg(to_jsonb(ar.*)) AS jsonb_agg
           FROM public.arrests ar
          WHERE ((ar.person_id)::text = (p.person_id)::text)) AS arrests,
    ( SELECT jsonb_agg(to_jsonb(cs.*)) AS jsonb_agg
           FROM (public.chargesheets cs
             JOIN public.chargesheet_accused csa ON (((cs.charge_sheet_id)::text = (csa.chargesheet_id)::text)))
          WHERE ((csa.accused_person_id)::text = (p.person_id)::text)) AS chargesheets,
    ( SELECT jsonb_agg(to_jsonb(fpb.*)) AS jsonb_agg
           FROM (public.fpb_accused fpb
             JOIN public.accused a3 ON (((fpb.crime_id)::text = (a3.crime_id)::text)))
          WHERE ((a3.person_id)::text = (p.person_id)::text)) AS fingerprint_bureau_records,
    ( SELECT jsonb_agg(to_jsonb(ir.*)) AS jsonb_agg
           FROM public.interrogation_reports ir
          WHERE ((ir.person_id)::text = (p.person_id)::text)) AS interrogation_reports,
    ( SELECT jsonb_agg(to_jsonb(fh.*)) AS jsonb_agg
           FROM public.ir_family_history fh
          WHERE ((fh.person_id)::text = (p.person_id)::text)) AS family_history,
    ( SELECT jsonb_agg(to_jsonb(lc.*)) AS jsonb_agg
           FROM public.ir_local_contacts lc
          WHERE ((lc.person_id)::text = (p.person_id)::text)) AS local_contacts,
    ( SELECT jsonb_agg(to_jsonb(mo.*)) AS jsonb_agg
           FROM (public.ir_modus_operandi mo
             JOIN public.interrogation_reports ir_inner ON (((mo.interrogation_report_id)::text = (ir_inner.interrogation_report_id)::text)))
          WHERE ((ir_inner.person_id)::text = (p.person_id)::text)) AS modus_operandi,
    ( SELECT jsonb_agg(to_jsonb(rh.*)) AS jsonb_agg
           FROM (public.ir_regular_habits rh
             JOIN public.interrogation_reports ir_inner ON (((rh.interrogation_report_id)::text = (ir_inner.interrogation_report_id)::text)))
          WHERE ((ir_inner.person_id)::text = (p.person_id)::text)) AS regular_habits
   FROM public.persons p
  WHERE (EXISTS ( SELECT 1
           FROM public.accused a
          WHERE ((a.person_id)::text = (p.person_id)::text)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_offender_details OWNER TO cctns_prod;

--
-- TOC entry 303 (class 1259 OID 34828)
-- Name: mv_offenders_list; Type: MATERIALIZED VIEW; Schema: public; Owner: cctns_prod
--

CREATE MATERIALIZED VIEW public.mv_offenders_list AS
 SELECT p.person_id AS offender_id,
    p.full_name AS offender_name,
    p.alias AS offender_alias,
    a.accused_status AS current_status,
    c.fir_date AS offence_date,
    c.crime_type AS primary_offence,
    h.ps_name AS police_station,
    risk.tier AS risk_tier
   FROM ((((public.accused a
     JOIN public.persons p ON (((a.person_id)::text = (p.person_id)::text)))
     JOIN public.crimes c ON (((a.crime_id)::text = (c.crime_id)::text)))
     LEFT JOIN public.hierarchy h ON (((c.ps_code)::text = (h.ps_code)::text)))
     LEFT JOIN LATERAL ( SELECT kb.tier
           FROM public.ssor_kb kb
          WHERE (c.acts_sections ~~* (('%'::text || kb.section_code) || '%'::text))
          ORDER BY kb.severity_rank DESC
         LIMIT 1) risk ON (true))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_offenders_list OWNER TO cctns_prod;

--
-- TOC entry 304 (class 1259 OID 34835)
-- Name: properties; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.properties (
    property_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    case_property_id character varying(50),
    property_status character varying(100),
    recovered_from character varying(255),
    place_of_recovery text,
    date_of_seizure timestamp with time zone,
    nature character varying(255),
    belongs character varying(100),
    estimate_value numeric(15,2),
    recovered_value numeric(15,2),
    particular_of_property text,
    category character varying(100),
    additional_details jsonb,
    media jsonb DEFAULT '[]'::jsonb,
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.properties OWNER TO cctns_prod;

--
-- TOC entry 305 (class 1259 OID 34841)
-- Name: properties_pending_fk; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.properties_pending_fk (
    id integer NOT NULL,
    property_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    raw_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    retry_count integer DEFAULT 0,
    last_retry_at timestamp without time zone,
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone
);


ALTER TABLE public.properties_pending_fk OWNER TO cctns_prod;

--
-- TOC entry 306 (class 1259 OID 34849)
-- Name: properties_pending_fk_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.properties_pending_fk_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_pending_fk_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 306
-- Name: properties_pending_fk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.properties_pending_fk_id_seq OWNED BY public.properties_pending_fk.id;


--
-- TOC entry 307 (class 1259 OID 34850)
-- Name: property_additional_details; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.property_additional_details (
    property_id character varying(50) NOT NULL,
    additional_details jsonb NOT NULL,
    date_created timestamp with time zone,
    date_modified timestamp with time zone,
    CONSTRAINT property_additional_details_json_is_object CHECK ((jsonb_typeof(additional_details) = 'object'::text))
);


ALTER TABLE public.property_additional_details OWNER TO cctns_prod;

--
-- TOC entry 308 (class 1259 OID 34856)
-- Name: property_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.property_media (
    id bigint NOT NULL,
    property_id character varying(50) NOT NULL,
    media_index integer NOT NULL,
    media_file_id text,
    media_url text,
    media_payload jsonb,
    date_created timestamp with time zone,
    date_modified timestamp with time zone
);


ALTER TABLE public.property_media OWNER TO cctns_prod;

--
-- TOC entry 309 (class 1259 OID 34861)
-- Name: ssor_kb_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.ssor_kb_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ssor_kb_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 309
-- Name: ssor_kb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ssor_kb_id_seq OWNED BY public.ssor_kb.id;


--
-- TOC entry 310 (class 1259 OID 34862)
-- Name: stolen_automobile_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.stolen_automobile_media (
    id bigint NOT NULL,
    stolen_property_id character varying(50) NOT NULL,
    media_ref text
);


ALTER TABLE public.stolen_automobile_media OWNER TO cctns_prod;

--
-- TOC entry 311 (class 1259 OID 34867)
-- Name: stolen_automobile_media_id_seq; Type: SEQUENCE; Schema: public; Owner: cctns_prod
--

CREATE SEQUENCE public.stolen_automobile_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stolen_automobile_media_id_seq OWNER TO cctns_prod;

--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 311
-- Name: stolen_automobile_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.stolen_automobile_media_id_seq OWNED BY public.stolen_automobile_media.id;


--
-- TOC entry 312 (class 1259 OID 34868)
-- Name: stolen_automobiles; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.stolen_automobiles (
    stolen_property_id character varying(50) NOT NULL,
    crime_id character varying(50) NOT NULL,
    auto_seq_no text,
    auto_type text,
    belongs_to_whom text,
    chassis_no text,
    classification text,
    color text,
    color_type text,
    date_created timestamp without time zone,
    date_modified timestamp without time zone,
    date_of_seizure timestamp without time zone,
    district text,
    driver_side text,
    engine_capacity text,
    engine_no text,
    estimate_value numeric,
    fuel text,
    full_chassis_no text,
    full_engine_no text,
    insurance_certificate_no text,
    insurance_company_name text,
    license_class text,
    lifting_capacity numeric,
    location_type text,
    made text,
    make text,
    manufactured text,
    manufacturer text,
    mfg_month text,
    mfg_year text,
    model text,
    mv_utility text,
    nature_of_stolen text,
    over_all_length numeric,
    owner_father_name text,
    owner_name text,
    particular_of_property text,
    permanent_address text,
    place_of_recovery text,
    present_address text,
    property_category text,
    property_category_name text,
    property_recovered_from text,
    property_status text,
    recovered_value numeric,
    registered_at text,
    registered_mobile_no text,
    registered_owner text,
    registration_date timestamp without time zone,
    registration_no text,
    registration_number text,
    registration_place text,
    registration_valid_upto timestamp without time zone,
    remarks text,
    rta_name text,
    rta_verification_date timestamp without time zone,
    seat_capacity numeric,
    seq_no text,
    slogan_picture text,
    special_identification text,
    sub_classification text,
    tmp_registration_no text,
    total_estimated_value numeric,
    ulw numeric,
    variant text,
    wheel_base numeric
);


ALTER TABLE public.stolen_automobiles OWNER TO cctns_prod;

--
-- TOC entry 313 (class 1259 OID 34873)
-- Name: v_offender_details; Type: VIEW; Schema: public; Owner: cctns_prod
--

CREATE VIEW public.v_offender_details AS
 SELECT person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    ( SELECT to_jsonb(a_inner.*) AS to_jsonb
           FROM public.accused a_inner
          WHERE ((a_inner.person_id)::text = (p.person_id)::text)
          ORDER BY a_inner.seq_num DESC
         LIMIT 1) AS latest_physical_features,
    ( SELECT kb.tier
           FROM ((public.accused a_inner
             JOIN public.crimes c_inner ON (((a_inner.crime_id)::text = (c_inner.crime_id)::text)))
             JOIN public.ssor_kb kb ON ((c_inner.acts_sections ~~* (('%'::text || kb.section_code) || '%'::text))))
          WHERE ((a_inner.person_id)::text = (p.person_id)::text)
          ORDER BY kb.severity_rank DESC
         LIMIT 1) AS highest_risk_tier,
    ( SELECT jsonb_agg(to_jsonb(c.*)) AS jsonb_agg
           FROM (public.crimes c
             JOIN public.accused a2 ON (((c.crime_id)::text = (a2.crime_id)::text)))
          WHERE ((a2.person_id)::text = (p.person_id)::text)) AS crimes,
    ( SELECT jsonb_agg(to_jsonb(ar.*)) AS jsonb_agg
           FROM public.arrests ar
          WHERE ((ar.person_id)::text = (p.person_id)::text)) AS arrests,
    ( SELECT jsonb_agg(to_jsonb(cs.*)) AS jsonb_agg
           FROM (public.chargesheets cs
             JOIN public.chargesheet_accused csa ON (((cs.charge_sheet_id)::text = (csa.chargesheet_id)::text)))
          WHERE ((csa.accused_person_id)::text = (p.person_id)::text)) AS chargesheets,
    ( SELECT jsonb_agg(to_jsonb(fpb.*)) AS jsonb_agg
           FROM (public.fpb_accused fpb
             JOIN public.accused a3 ON (((fpb.crime_id)::text = (a3.crime_id)::text)))
          WHERE ((a3.person_id)::text = (p.person_id)::text)) AS fingerprint_bureau_records,
    ( SELECT jsonb_agg(to_jsonb(ir.*)) AS jsonb_agg
           FROM public.interrogation_reports ir
          WHERE ((ir.person_id)::text = (p.person_id)::text)) AS interrogation_reports,
    ( SELECT jsonb_agg(to_jsonb(fh.*)) AS jsonb_agg
           FROM public.ir_family_history fh
          WHERE ((fh.person_id)::text = (p.person_id)::text)) AS family_history,
    ( SELECT jsonb_agg(to_jsonb(lc.*)) AS jsonb_agg
           FROM public.ir_local_contacts lc
          WHERE ((lc.person_id)::text = (p.person_id)::text)) AS local_contacts,
    ( SELECT jsonb_agg(to_jsonb(mo.*)) AS jsonb_agg
           FROM (public.ir_modus_operandi mo
             JOIN public.interrogation_reports ir_inner ON (((mo.interrogation_report_id)::text = (ir_inner.interrogation_report_id)::text)))
          WHERE ((ir_inner.person_id)::text = (p.person_id)::text)) AS modus_operandi,
    ( SELECT jsonb_agg(to_jsonb(rh.*)) AS jsonb_agg
           FROM (public.ir_regular_habits rh
             JOIN public.interrogation_reports ir_inner ON (((rh.interrogation_report_id)::text = (ir_inner.interrogation_report_id)::text)))
          WHERE ((ir_inner.person_id)::text = (p.person_id)::text)) AS regular_habits
   FROM public.persons p
  WHERE (EXISTS ( SELECT 1
           FROM public.accused a
          WHERE ((a.person_id)::text = (p.person_id)::text)));


ALTER VIEW public.v_offender_details OWNER TO cctns_prod;

--
-- TOC entry 314 (class 1259 OID 34878)
-- Name: v_offenders_list; Type: VIEW; Schema: public; Owner: cctns_prod
--

CREATE VIEW public.v_offenders_list AS
 WITH latestoffences AS (
         SELECT DISTINCT ON (p.person_id) p.person_id AS offender_id,
            p.full_name AS offender_name,
            p.alias AS offender_alias,
            a.accused_status AS current_status,
            c.fir_date AS offence_date,
            c.crime_type AS primary_offence,
            h.ps_name AS police_station,
            risk.tier AS risk_tier
           FROM ((((public.accused a
             JOIN public.persons p ON (((a.person_id)::text = (p.person_id)::text)))
             JOIN public.crimes c ON (((a.crime_id)::text = (c.crime_id)::text)))
             LEFT JOIN public.hierarchy h ON (((c.ps_code)::text = (h.ps_code)::text)))
             LEFT JOIN LATERAL ( SELECT kb.tier
                   FROM public.ssor_kb kb
                  WHERE (c.acts_sections ~~* (('%'::text || kb.section_code) || '%'::text))
                  ORDER BY kb.severity_rank DESC
                 LIMIT 1) risk ON (true))
          ORDER BY p.person_id, c.fir_date DESC
        )
 SELECT offender_id,
    offender_name,
    offender_alias,
    current_status,
    offence_date,
    primary_offence,
    police_station,
    risk_tier
   FROM latestoffences
  ORDER BY offence_date DESC;


ALTER VIEW public.v_offenders_list OWNER TO cctns_prod;

--
-- TOC entry 4011 (class 2604 OID 37418)
-- Name: SystemAuditLog id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."SystemAuditLog" ALTER COLUMN id SET DEFAULT nextval('public."SystemAuditLog_id_seq"'::regclass);


--
-- TOC entry 3920 (class 2604 OID 34883)
-- Name: charge_sheet_updates id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates ALTER COLUMN id SET DEFAULT nextval('public.charge_sheet_updates_id_seq'::regclass);


--
-- TOC entry 3944 (class 2604 OID 34884)
-- Name: fpb_accused fpb_accused_id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused ALTER COLUMN fpb_accused_id SET DEFAULT nextval('public.fpb_accused_fpb_accused_id_seq'::regclass);


--
-- TOC entry 3946 (class 2604 OID 34885)
-- Name: fpb_additional_crimes id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_additional_crimes ALTER COLUMN id SET DEFAULT nextval('public.fpb_additional_crimes_id_seq'::regclass);


--
-- TOC entry 3947 (class 2604 OID 34886)
-- Name: ir_associate_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_associate_details ALTER COLUMN id SET DEFAULT nextval('public.ir_associate_details_id_seq'::regclass);


--
-- TOC entry 3948 (class 2604 OID 34887)
-- Name: ir_consumer_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_consumer_details ALTER COLUMN id SET DEFAULT nextval('public.ir_consumer_details_id_seq'::regclass);


--
-- TOC entry 3949 (class 2604 OID 34888)
-- Name: ir_conviction_acquittal id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_conviction_acquittal ALTER COLUMN id SET DEFAULT nextval('public.ir_conviction_acquittal_id_seq'::regclass);


--
-- TOC entry 3952 (class 2604 OID 34889)
-- Name: ir_defence_counsel id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_defence_counsel ALTER COLUMN id SET DEFAULT nextval('public.ir_defence_counsel_id_seq'::regclass);


--
-- TOC entry 3955 (class 2604 OID 34890)
-- Name: ir_dopams_links id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_dopams_links ALTER COLUMN id SET DEFAULT nextval('public.ir_dopams_links_id_seq'::regclass);


--
-- TOC entry 3956 (class 2604 OID 34891)
-- Name: ir_execution_of_nbw id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_execution_of_nbw ALTER COLUMN id SET DEFAULT nextval('public.ir_execution_of_nbw_id_seq'::regclass);


--
-- TOC entry 3959 (class 2604 OID 34892)
-- Name: ir_family_history id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_family_history ALTER COLUMN id SET DEFAULT nextval('public.ir_family_history_id_seq'::regclass);


--
-- TOC entry 3963 (class 2604 OID 34893)
-- Name: ir_financial_history id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_financial_history ALTER COLUMN id SET DEFAULT nextval('public.ir_financial_history_id_seq'::regclass);


--
-- TOC entry 3964 (class 2604 OID 34894)
-- Name: ir_indulgance_before_offence id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_indulgance_before_offence ALTER COLUMN id SET DEFAULT nextval('public.ir_indulgance_before_offence_id_seq'::regclass);


--
-- TOC entry 3966 (class 2604 OID 34895)
-- Name: ir_interrogation_report_refs id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_interrogation_report_refs ALTER COLUMN id SET DEFAULT nextval('public.ir_interrogation_report_refs_id_seq'::regclass);


--
-- TOC entry 3967 (class 2604 OID 34896)
-- Name: ir_jail_sentence id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_jail_sentence ALTER COLUMN id SET DEFAULT nextval('public.ir_jail_sentence_id_seq'::regclass);


--
-- TOC entry 3970 (class 2604 OID 34897)
-- Name: ir_local_contacts id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_local_contacts ALTER COLUMN id SET DEFAULT nextval('public.ir_local_contacts_id_seq'::regclass);


--
-- TOC entry 3971 (class 2604 OID 34898)
-- Name: ir_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_media ALTER COLUMN id SET DEFAULT nextval('public.ir_media_id_seq'::regclass);


--
-- TOC entry 3972 (class 2604 OID 34899)
-- Name: ir_modus_operandi id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_modus_operandi ALTER COLUMN id SET DEFAULT nextval('public.ir_modus_operandi_id_seq'::regclass);


--
-- TOC entry 3973 (class 2604 OID 34900)
-- Name: ir_new_gang_formation id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_new_gang_formation ALTER COLUMN id SET DEFAULT nextval('public.ir_new_gang_formation_id_seq'::regclass);


--
-- TOC entry 3993 (class 2604 OID 34901)
-- Name: ir_pending_fk id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_fk ALTER COLUMN id SET DEFAULT nextval('public.ir_pending_fk_id_seq'::regclass);


--
-- TOC entry 3976 (class 2604 OID 34902)
-- Name: ir_pending_nbw id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_nbw ALTER COLUMN id SET DEFAULT nextval('public.ir_pending_nbw_id_seq'::regclass);


--
-- TOC entry 3979 (class 2604 OID 34903)
-- Name: ir_previous_offences_confessed id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_previous_offences_confessed ALTER COLUMN id SET DEFAULT nextval('public.ir_previous_offences_confessed_id_seq'::regclass);


--
-- TOC entry 3980 (class 2604 OID 34904)
-- Name: ir_property_disposal id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_property_disposal ALTER COLUMN id SET DEFAULT nextval('public.ir_property_disposal_id_seq'::regclass);


--
-- TOC entry 3983 (class 2604 OID 34905)
-- Name: ir_regular_habits id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regular_habits ALTER COLUMN id SET DEFAULT nextval('public.ir_regular_habits_id_seq'::regclass);


--
-- TOC entry 3984 (class 2604 OID 34906)
-- Name: ir_regularization_transit_warrants id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regularization_transit_warrants ALTER COLUMN id SET DEFAULT nextval('public.ir_regularization_transit_warrants_id_seq'::regclass);


--
-- TOC entry 3987 (class 2604 OID 34907)
-- Name: ir_shelter id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_shelter ALTER COLUMN id SET DEFAULT nextval('public.ir_shelter_id_seq'::regclass);


--
-- TOC entry 3988 (class 2604 OID 34908)
-- Name: ir_sim_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sim_details ALTER COLUMN id SET DEFAULT nextval('public.ir_sim_details_id_seq'::regclass);


--
-- TOC entry 3989 (class 2604 OID 34909)
-- Name: ir_sureties id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sureties ALTER COLUMN id SET DEFAULT nextval('public.ir_sureties_id_seq'::regclass);


--
-- TOC entry 3992 (class 2604 OID 34910)
-- Name: ir_types_of_drugs id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_types_of_drugs ALTER COLUMN id SET DEFAULT nextval('public.ir_types_of_drugs_id_seq'::regclass);


--
-- TOC entry 3997 (class 2604 OID 34911)
-- Name: mo_seizure_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.mo_seizure_media ALTER COLUMN id SET DEFAULT nextval('public.mo_seizure_media_id_seq'::regclass);


--
-- TOC entry 4004 (class 2604 OID 34912)
-- Name: properties_pending_fk id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties_pending_fk ALTER COLUMN id SET DEFAULT nextval('public.properties_pending_fk_id_seq'::regclass);


--
-- TOC entry 4002 (class 2604 OID 34913)
-- Name: ssor_kb id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb ALTER COLUMN id SET DEFAULT nextval('public.ssor_kb_id_seq'::regclass);


--
-- TOC entry 4008 (class 2604 OID 34914)
-- Name: stolen_automobile_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobile_media ALTER COLUMN id SET DEFAULT nextval('public.stolen_automobile_media_id_seq'::regclass);


--
-- TOC entry 4147 (class 2606 OID 37451)
-- Name: CandidateVerification CandidateVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."CandidateVerification"
    ADD CONSTRAINT "CandidateVerification_pkey" PRIMARY KEY (id);


--
-- TOC entry 4155 (class 2606 OID 37483)
-- Name: EPettyCase EPettyCase_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."EPettyCase"
    ADD CONSTRAINT "EPettyCase_pkey" PRIMARY KEY (id);


--
-- TOC entry 4144 (class 2606 OID 37440)
-- Name: OrganizationProfile OrganizationProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."OrganizationProfile"
    ADD CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY (id);


--
-- TOC entry 4141 (class 2606 OID 37431)
-- Name: PoliceProfile PoliceProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."PoliceProfile"
    ADD CONSTRAINT "PoliceProfile_pkey" PRIMARY KEY (id);


--
-- TOC entry 4149 (class 2606 OID 37463)
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- TOC entry 4139 (class 2606 OID 37423)
-- Name: SystemAuditLog SystemAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 4152 (class 2606 OID 37472)
-- Name: TicketMessage TicketMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY (id);


--
-- TOC entry 4137 (class 2606 OID 37412)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 4032 (class 2606 OID 35466)
-- Name: charge_sheet_updates charge_sheet_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates
    ADD CONSTRAINT charge_sheet_updates_pkey PRIMARY KEY (id);


--
-- TOC entry 4034 (class 2606 OID 35468)
-- Name: charge_sheet_updates charge_sheet_updates_update_charge_sheet_id_key; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates
    ADD CONSTRAINT charge_sheet_updates_update_charge_sheet_id_key UNIQUE (update_charge_sheet_id);


--
-- TOC entry 4043 (class 2606 OID 35470)
-- Name: etl_run_state etl_run_state_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.etl_run_state
    ADD CONSTRAINT etl_run_state_pkey PRIMARY KEY (module_name);


--
-- TOC entry 4045 (class 2606 OID 35472)
-- Name: fpb_accused fpb_accused_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused
    ADD CONSTRAINT fpb_accused_pkey PRIMARY KEY (fpb_accused_id);


--
-- TOC entry 4051 (class 2606 OID 35474)
-- Name: fpb_additional_crimes fpb_additional_crimes_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_additional_crimes
    ADD CONSTRAINT fpb_additional_crimes_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 2606 OID 35476)
-- Name: ir_conviction_acquittal ir_conviction_acquittal_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_conviction_acquittal
    ADD CONSTRAINT ir_conviction_acquittal_pkey PRIMARY KEY (id);


--
-- TOC entry 4069 (class 2606 OID 35478)
-- Name: ir_defence_counsel ir_defence_counsel_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_defence_counsel
    ADD CONSTRAINT ir_defence_counsel_pkey PRIMARY KEY (id);


--
-- TOC entry 4073 (class 2606 OID 35480)
-- Name: ir_execution_of_nbw ir_execution_of_nbw_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_execution_of_nbw
    ADD CONSTRAINT ir_execution_of_nbw_pkey PRIMARY KEY (id);


--
-- TOC entry 4080 (class 2606 OID 35482)
-- Name: ir_jail_sentence ir_jail_sentence_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_jail_sentence
    ADD CONSTRAINT ir_jail_sentence_pkey PRIMARY KEY (id);


--
-- TOC entry 4087 (class 2606 OID 35484)
-- Name: ir_new_gang_formation ir_new_gang_formation_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_new_gang_formation
    ADD CONSTRAINT ir_new_gang_formation_pkey PRIMARY KEY (id);


--
-- TOC entry 4108 (class 2606 OID 35486)
-- Name: ir_pending_fk ir_pending_fk_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_fk
    ADD CONSTRAINT ir_pending_fk_pkey PRIMARY KEY (id);


--
-- TOC entry 4090 (class 2606 OID 35488)
-- Name: ir_pending_nbw ir_pending_nbw_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_nbw
    ADD CONSTRAINT ir_pending_nbw_pkey PRIMARY KEY (id);


--
-- TOC entry 4094 (class 2606 OID 35490)
-- Name: ir_property_disposal ir_property_disposal_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_property_disposal
    ADD CONSTRAINT ir_property_disposal_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 35492)
-- Name: ir_regularization_transit_warrants ir_regularization_transit_warrants_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regularization_transit_warrants
    ADD CONSTRAINT ir_regularization_transit_warrants_pkey PRIMARY KEY (id);


--
-- TOC entry 4104 (class 2606 OID 35494)
-- Name: ir_sureties ir_sureties_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sureties
    ADD CONSTRAINT ir_sureties_pkey PRIMARY KEY (id);


--
-- TOC entry 4110 (class 2606 OID 35496)
-- Name: mo_seizure_media mo_seizure_media_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.mo_seizure_media
    ADD CONSTRAINT mo_seizure_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4030 (class 2606 OID 35498)
-- Name: accused pk_accused_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.accused
    ADD CONSTRAINT pk_accused_id PRIMARY KEY (accused_id);


--
-- TOC entry 4039 (class 2606 OID 35500)
-- Name: crimes pk_crimes_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.crimes
    ADD CONSTRAINT pk_crimes_id PRIMARY KEY (crime_id);


--
-- TOC entry 4060 (class 2606 OID 35502)
-- Name: interrogation_reports pk_ir_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.interrogation_reports
    ADD CONSTRAINT pk_ir_id PRIMARY KEY (interrogation_report_id);


--
-- TOC entry 4112 (class 2606 OID 35504)
-- Name: persons pk_persons_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT pk_persons_id PRIMARY KEY (person_id);


--
-- TOC entry 4120 (class 2606 OID 35506)
-- Name: properties pk_properties_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT pk_properties_id PRIMARY KEY (property_id);


--
-- TOC entry 4123 (class 2606 OID 35508)
-- Name: properties_pending_fk properties_pending_fk_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties_pending_fk
    ADD CONSTRAINT properties_pending_fk_pkey PRIMARY KEY (id);


--
-- TOC entry 4125 (class 2606 OID 35510)
-- Name: property_additional_details property_additional_details_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.property_additional_details
    ADD CONSTRAINT property_additional_details_pkey PRIMARY KEY (property_id);


--
-- TOC entry 4127 (class 2606 OID 35512)
-- Name: property_media property_media_unique_entry; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_unique_entry UNIQUE (property_id, media_index);


--
-- TOC entry 4114 (class 2606 OID 35514)
-- Name: ssor_kb ssor_kb_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb
    ADD CONSTRAINT ssor_kb_pkey PRIMARY KEY (id);


--
-- TOC entry 4130 (class 2606 OID 35516)
-- Name: stolen_automobile_media stolen_automobile_media_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobile_media
    ADD CONSTRAINT stolen_automobile_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4134 (class 2606 OID 35518)
-- Name: stolen_automobiles stolen_automobiles_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobiles
    ADD CONSTRAINT stolen_automobiles_pkey PRIMARY KEY (stolen_property_id);


--
-- TOC entry 4041 (class 2606 OID 35520)
-- Name: disposal uk_disposal_composite; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.disposal
    ADD CONSTRAINT uk_disposal_composite UNIQUE (crime_id, disposal_type, disposed_at);


--
-- TOC entry 4049 (class 2606 OID 35522)
-- Name: fpb_accused uq_fpb_accused_fir_ps_name; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused
    ADD CONSTRAINT uq_fpb_accused_fir_ps_name UNIQUE (fir_num, ps_code, full_name);


--
-- TOC entry 4116 (class 2606 OID 35524)
-- Name: ssor_kb uq_ssor_kb_section; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb
    ADD CONSTRAINT uq_ssor_kb_section UNIQUE (act_name, section_code);


--
-- TOC entry 4153 (class 1259 OID 37484)
-- Name: EPettyCase_caseNumber_key; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX "EPettyCase_caseNumber_key" ON public."EPettyCase" USING btree ("caseNumber");


--
-- TOC entry 4145 (class 1259 OID 37441)
-- Name: OrganizationProfile_userId_key; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX "OrganizationProfile_userId_key" ON public."OrganizationProfile" USING btree ("userId");


--
-- TOC entry 4142 (class 1259 OID 37432)
-- Name: PoliceProfile_userId_key; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX "PoliceProfile_userId_key" ON public."PoliceProfile" USING btree ("userId");


--
-- TOC entry 4150 (class 1259 OID 37464)
-- Name: SupportTicket_ticketNumber_key; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON public."SupportTicket" USING btree ("ticketNumber");


--
-- TOC entry 4135 (class 1259 OID 37413)
-- Name: User_loginId_key; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX "User_loginId_key" ON public."User" USING btree ("loginId");


--
-- TOC entry 4035 (class 1259 OID 35525)
-- Name: idx_crimes_coalesce_date; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_coalesce_date ON public.crimes USING btree (COALESCE(date_modified, date_created) DESC NULLS LAST);


--
-- TOC entry 4036 (class 1259 OID 35526)
-- Name: idx_crimes_date_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_date_created ON public.crimes USING btree (date_created DESC NULLS LAST);


--
-- TOC entry 4037 (class 1259 OID 35527)
-- Name: idx_crimes_date_modified_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_date_modified_created ON public.crimes USING btree (date_modified DESC NULLS LAST, date_created DESC NULLS LAST);


--
-- TOC entry 4046 (class 1259 OID 35528)
-- Name: idx_fpb_accused_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_accused_crime_id ON public.fpb_accused USING btree (crime_id);


--
-- TOC entry 4047 (class 1259 OID 35529)
-- Name: idx_fpb_accused_fir_ps; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_accused_fir_ps ON public.fpb_accused USING btree (fir_num, ps_code);


--
-- TOC entry 4052 (class 1259 OID 35530)
-- Name: idx_fpb_additional_crimes_parent; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_additional_crimes_parent ON public.fpb_additional_crimes USING btree (fpb_accused_id);


--
-- TOC entry 4053 (class 1259 OID 35531)
-- Name: idx_fsl_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_created ON public.fsl_case_property USING btree (date_created DESC NULLS LAST);


--
-- TOC entry 4054 (class 1259 OID 35532)
-- Name: idx_fsl_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_crime_id ON public.fsl_case_property USING btree (crime_id);


--
-- TOC entry 4055 (class 1259 OID 35533)
-- Name: idx_fsl_mo_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_mo_id ON public.fsl_case_property USING btree (mo_id);


--
-- TOC entry 4056 (class 1259 OID 35534)
-- Name: idx_fsl_status; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_status ON public.fsl_case_property USING btree (status);


--
-- TOC entry 4061 (class 1259 OID 35535)
-- Name: idx_ir_associate_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_associate_details_ir_id ON public.ir_associate_details USING btree (interrogation_report_id);


--
-- TOC entry 4062 (class 1259 OID 35536)
-- Name: idx_ir_consumer_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_consumer_details_ir_id ON public.ir_consumer_details USING btree (interrogation_report_id);


--
-- TOC entry 4063 (class 1259 OID 35537)
-- Name: idx_ir_conviction_acquittal_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_conviction_acquittal_ir_id ON public.ir_conviction_acquittal USING btree (interrogation_report_id);


--
-- TOC entry 4066 (class 1259 OID 35538)
-- Name: idx_ir_defence_counsel_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_defence_counsel_ir_id ON public.ir_defence_counsel USING btree (interrogation_report_id);


--
-- TOC entry 4067 (class 1259 OID 35539)
-- Name: idx_ir_defence_counsel_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_defence_counsel_person_id ON public.ir_defence_counsel USING btree (defence_counsel_person_id);


--
-- TOC entry 4070 (class 1259 OID 35540)
-- Name: idx_ir_dopams_links_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_dopams_links_ir_id ON public.ir_dopams_links USING btree (interrogation_report_id);


--
-- TOC entry 4071 (class 1259 OID 35541)
-- Name: idx_ir_execution_of_nbw_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_execution_of_nbw_ir_id ON public.ir_execution_of_nbw USING btree (interrogation_report_id);


--
-- TOC entry 4074 (class 1259 OID 35542)
-- Name: idx_ir_family_history_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_family_history_ir_id ON public.ir_family_history USING btree (interrogation_report_id);


--
-- TOC entry 4075 (class 1259 OID 35543)
-- Name: idx_ir_financial_history_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_financial_history_ir_id ON public.ir_financial_history USING btree (interrogation_report_id);


--
-- TOC entry 4076 (class 1259 OID 35544)
-- Name: idx_ir_indulgance_before_offence_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_indulgance_before_offence_ir_id ON public.ir_indulgance_before_offence USING btree (interrogation_report_id);


--
-- TOC entry 4077 (class 1259 OID 35545)
-- Name: idx_ir_interrogation_report_refs_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_interrogation_report_refs_ir_id ON public.ir_interrogation_report_refs USING btree (interrogation_report_id);


--
-- TOC entry 4078 (class 1259 OID 35546)
-- Name: idx_ir_jail_sentence_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_jail_sentence_ir_id ON public.ir_jail_sentence USING btree (interrogation_report_id);


--
-- TOC entry 4081 (class 1259 OID 35547)
-- Name: idx_ir_local_contacts_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_local_contacts_ir_id ON public.ir_local_contacts USING btree (interrogation_report_id);


--
-- TOC entry 4082 (class 1259 OID 35548)
-- Name: idx_ir_media_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_media_ir_id ON public.ir_media USING btree (interrogation_report_id);


--
-- TOC entry 4083 (class 1259 OID 35549)
-- Name: idx_ir_modus_operandi_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_modus_operandi_ir_id ON public.ir_modus_operandi USING btree (interrogation_report_id);


--
-- TOC entry 4084 (class 1259 OID 35550)
-- Name: idx_ir_new_gang_formation_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_new_gang_formation_ir_id ON public.ir_new_gang_formation USING btree (interrogation_report_id);


--
-- TOC entry 4085 (class 1259 OID 35551)
-- Name: idx_ir_new_gang_formation_leader_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_new_gang_formation_leader_person_id ON public.ir_new_gang_formation USING btree (leader_person_id);


--
-- TOC entry 4088 (class 1259 OID 35552)
-- Name: idx_ir_pending_nbw_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_pending_nbw_ir_id ON public.ir_pending_nbw USING btree (interrogation_report_id);


--
-- TOC entry 4091 (class 1259 OID 35553)
-- Name: idx_ir_previous_offences_confessed_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_previous_offences_confessed_ir_id ON public.ir_previous_offences_confessed USING btree (interrogation_report_id);


--
-- TOC entry 4092 (class 1259 OID 35554)
-- Name: idx_ir_property_disposal_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_property_disposal_ir_id ON public.ir_property_disposal USING btree (interrogation_report_id);


--
-- TOC entry 4095 (class 1259 OID 35555)
-- Name: idx_ir_regular_habits_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_regular_habits_ir_id ON public.ir_regular_habits USING btree (interrogation_report_id);


--
-- TOC entry 4096 (class 1259 OID 35556)
-- Name: idx_ir_regularization_transit_warrants_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_regularization_transit_warrants_ir_id ON public.ir_regularization_transit_warrants USING btree (interrogation_report_id);


--
-- TOC entry 4057 (class 1259 OID 35557)
-- Name: idx_ir_reports_created_modified; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_reports_created_modified ON public.interrogation_reports USING btree (date_created, date_modified);


--
-- TOC entry 4058 (class 1259 OID 35558)
-- Name: idx_ir_reports_crime_person; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_reports_crime_person ON public.interrogation_reports USING btree (crime_id, person_id);


--
-- TOC entry 4099 (class 1259 OID 35559)
-- Name: idx_ir_shelter_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_shelter_ir_id ON public.ir_shelter USING btree (interrogation_report_id);


--
-- TOC entry 4100 (class 1259 OID 35560)
-- Name: idx_ir_sim_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sim_details_ir_id ON public.ir_sim_details USING btree (interrogation_report_id);


--
-- TOC entry 4101 (class 1259 OID 35561)
-- Name: idx_ir_sureties_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sureties_ir_id ON public.ir_sureties USING btree (interrogation_report_id);


--
-- TOC entry 4102 (class 1259 OID 35562)
-- Name: idx_ir_sureties_surety_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sureties_surety_person_id ON public.ir_sureties USING btree (surety_person_id);


--
-- TOC entry 4105 (class 1259 OID 35563)
-- Name: idx_ir_types_of_drugs_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_types_of_drugs_ir_id ON public.ir_types_of_drugs USING btree (interrogation_report_id);


--
-- TOC entry 4117 (class 1259 OID 35564)
-- Name: idx_mv_offender_details_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX idx_mv_offender_details_id ON public.mv_offender_details USING btree (offender_id);


--
-- TOC entry 4118 (class 1259 OID 35565)
-- Name: idx_mv_offenders_list_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_mv_offenders_list_id ON public.mv_offenders_list USING btree (offender_id);


--
-- TOC entry 4106 (class 1259 OID 35566)
-- Name: idx_pending_fk_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX idx_pending_fk_ir_id ON public.ir_pending_fk USING btree (ir_id) WHERE (NOT resolved);


--
-- TOC entry 4121 (class 1259 OID 35567)
-- Name: idx_pending_fk_property_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX idx_pending_fk_property_id ON public.properties_pending_fk USING btree (property_id) WHERE (NOT resolved);


--
-- TOC entry 4128 (class 1259 OID 35568)
-- Name: idx_stolen_automobile_media_parent; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobile_media_parent ON public.stolen_automobile_media USING btree (stolen_property_id);


--
-- TOC entry 4131 (class 1259 OID 35569)
-- Name: idx_stolen_automobiles_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobiles_crime_id ON public.stolen_automobiles USING btree (crime_id);


--
-- TOC entry 4132 (class 1259 OID 35570)
-- Name: idx_stolen_automobiles_date_modified; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobiles_date_modified ON public.stolen_automobiles USING btree (date_modified);


--
-- TOC entry 4159 (class 2606 OID 37500)
-- Name: CandidateVerification CandidateVerification_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."CandidateVerification"
    ADD CONSTRAINT "CandidateVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4158 (class 2606 OID 37495)
-- Name: OrganizationProfile OrganizationProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."OrganizationProfile"
    ADD CONSTRAINT "OrganizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4157 (class 2606 OID 37490)
-- Name: PoliceProfile PoliceProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."PoliceProfile"
    ADD CONSTRAINT "PoliceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4160 (class 2606 OID 37505)
-- Name: SupportTicket SupportTicket_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4156 (class 2606 OID 37485)
-- Name: SystemAuditLog SystemAuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4161 (class 2606 OID 37510)
-- Name: TicketMessage TicketMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-07-15 15:13:19 IST

--
-- PostgreSQL database dump complete
--

\unrestrict QXEkdQlNBoE1gCqJ8DcWl6mWhMYnfavxntRX7ba3p0JNXr5E0lVFqfLqKKcB0lf

