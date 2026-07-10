--
-- PostgreSQL database dump
--

\restrict vnTf0g8jnDHgP8NdFfK65s9pXER3chlwozJVahnaMcS33fecbokaOz1gGkqNyzt

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 17.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: cctns_prod
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO cctns_prod;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: cctns_prod
--

COMMENT ON SCHEMA public IS '';


--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
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
-- Name: TABLE accused; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.accused IS 'Links persons to crimes as accused with physical features';


--
-- Name: COLUMN accused.person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.accused.person_id IS 'Can be NULL - stub persons are created by ETL when needed';


--
-- Name: COLUMN accused.is_ccl; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.accused.is_ccl IS 'Is Child in Conflict with Law';


--
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
-- Name: TABLE charge_sheet_updates; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.charge_sheet_updates IS 'Stores charge sheet update records from DOPAMS API. Each record represents a charge sheet update with its  

  status and court filing information.';


--
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
-- Name: charge_sheet_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.charge_sheet_updates_id_seq OWNED BY public.charge_sheet_updates.id;


--
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
-- Name: TABLE chargesheet_acts_sections; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.chargesheet_acts_sections IS 'Normalized sections for chargesheets. One row per section entry extracted from actsAndSections[].';


--
-- Name: COLUMN chargesheet_acts_sections.chargesheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_acts_sections.chargesheet_id IS 'API chargeSheetId used as the logical parent key.';


--
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
-- Name: TABLE chargesheet_media; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.chargesheet_media IS 'Normalized media references for chargesheets. One row per uploadChargeSheet item.';


--
-- Name: COLUMN chargesheet_media.chargesheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_media.chargesheet_id IS 'API chargeSheetId used as the logical parent key.';


--
-- Name: COLUMN chargesheet_media.file_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheet_media.file_id IS 'uploadChargeSheet.fileId from the API payload.';


--
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
-- Name: COLUMN chargesheets.charge_sheet_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.chargesheets.charge_sheet_id IS 'API chargeSheetId. Natural key used by the chargesheets ETL for overwrite semantics.';


--
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
-- Name: TABLE crimes; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.crimes IS 'Crime/FIR records registered at police stations';


--
-- Name: COLUMN crimes.brief_facts; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.crimes.brief_facts IS 'Detailed description of the crime incident';


--
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
-- Name: etl_run_state; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.etl_run_state (
    module_name character varying(100) NOT NULL,
    last_successful_end character varying(30) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.etl_run_state OWNER TO cctns_prod;

--
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
-- Name: TABLE files; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.files IS 'Stores file references (UUIDs) from various sources (crimes, interrogations, properties, persons)';


--
-- Name: COLUMN files.source_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.source_type IS 'Type of source: crime, interrogation, property, or person';


--
-- Name: COLUMN files.source_field; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.source_field IS 'Field name from source: FIR_COPY, MEDIA, INTERROGATION_REPORT, DOPAMS_DATA, IDENTITY_DETAILS';


--
-- Name: COLUMN files.parent_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.parent_id IS 'ID of the parent record (crime_id, interrogation_report_id, property_id, or person_id)';


--
-- Name: COLUMN files.file_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_id IS 'The actual file UUID that can be used to fetch the file via API. NULL if field exists but has no file.';


--
-- Name: COLUMN files.has_field; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.has_field IS 'TRUE if the field exists in API response, FALSE if field is missing';


--
-- Name: COLUMN files.is_empty; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.is_empty IS 'TRUE if field exists but is null or empty array';


--
-- Name: COLUMN files.file_path; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_path IS 'Relative file path on Tomcat server (auto-generated, NULL if file_id is NULL)';


--
-- Name: COLUMN files.file_url; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_url IS 'Full file URL on Tomcat server (auto-generated, NULL if file_id is NULL)';


--
-- Name: COLUMN files.file_index; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.file_index IS 'Index position in array (for MEDIA arrays with multiple files)';


--
-- Name: COLUMN files.identity_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.identity_type IS 'For IDENTITY_DETAILS: type of identity document (Aadhar Card, Passport, etc.)';


--
-- Name: COLUMN files.identity_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.identity_number IS 'For IDENTITY_DETAILS: identity document number';


--
-- Name: COLUMN files.downloaded_at; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.downloaded_at IS 'Timestamp when file was successfully downloaded to media server';


--
-- Name: COLUMN files.is_downloaded; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.is_downloaded IS 'Flag indicating if file has been successfully downloaded to media server';


--
-- Name: COLUMN files.download_error; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.download_error IS 'Error message if file download failed';


--
-- Name: COLUMN files.download_attempts; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.download_attempts IS 'Number of download attempts made';


--
-- Name: COLUMN files.created_at; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.files.created_at IS 'Timestamp from API (DATE_CREATED or DATE_MODIFIED)';


--
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
-- Name: fpb_accused_fpb_accused_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.fpb_accused_fpb_accused_id_seq OWNED BY public.fpb_accused.fpb_accused_id;


--
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
-- Name: fpb_additional_crimes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.fpb_additional_crimes_id_seq OWNED BY public.fpb_additional_crimes.id;


--
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
-- Name: TABLE fsl_case_property; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.fsl_case_property IS 'Main table storing case property records from DOPAMS API';


--
-- Name: COLUMN fsl_case_property.case_property_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.case_property_id IS 'Primary key from API (CASE_PROPERTY_ID) - MongoDB ObjectId (24 hex characters)';


--
-- Name: COLUMN fsl_case_property.crime_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.crime_id IS 'Reference to crime/case (CRIME_ID) - Foreign key to crimes table';


--
-- Name: COLUMN fsl_case_property.mo_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.mo_id IS 'Material Object ID (MO_ID)';


--
-- Name: COLUMN fsl_case_property.status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.status IS 'Current status (e.g., Send To FSL, Send To Court)';


--
-- Name: COLUMN fsl_case_property.date_created; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.date_created IS 'Record creation timestamp from API (DATE_CREATED)';


--
-- Name: COLUMN fsl_case_property.date_modified; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.date_modified IS 'Record modification timestamp from API (DATE_MODIFIED)';


--
-- Name: COLUMN fsl_case_property.fsl_no; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.fsl_no IS 'FSL case number';


--
-- Name: COLUMN fsl_case_property.report_received; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.report_received IS 'Whether FSL report has been received';


--
-- Name: COLUMN fsl_case_property.property_received_back; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.fsl_case_property.property_received_back IS 'Whether property has been received back';


--
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
-- Name: TABLE hierarchy; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.hierarchy IS 'Police organizational hierarchy from ADG to Police Station in single table';


--
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
-- Name: TABLE interrogation_reports; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.interrogation_reports IS 'Main table storing Interrogation Report (IR) data. All common fields are stored as columns for easy querying.';


--
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
-- Name: TABLE ir_associate_details; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_associate_details IS 'Associate information for each IR record. One record per associate.';


--
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
-- Name: ir_associate_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_associate_details_id_seq OWNED BY public.ir_associate_details.id;


--
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
-- Name: TABLE ir_conviction_acquittal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_conviction_acquittal IS 'Conviction/acquittal details for each IR record. One record per case verdict entry.';


--
-- Name: COLUMN ir_conviction_acquittal.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_conviction_acquittal.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.crime_num IS 'Associated crime number';


--
-- Name: COLUMN ir_conviction_acquittal.court_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.court_name IS 'Court name where verdict was delivered';


--
-- Name: COLUMN ir_conviction_acquittal.verdict; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.verdict IS 'Verdict (Convicted, Acquitted, Discharged, etc.)';


--
-- Name: COLUMN ir_conviction_acquittal.verdict_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.verdict_date IS 'Date of verdict';


--
-- Name: COLUMN ir_conviction_acquittal.reason_if_acquitted; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.reason_if_acquitted IS 'Reason for acquittal if applicable';


--
-- Name: COLUMN ir_conviction_acquittal.sentence_if_convicted; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.sentence_if_convicted IS 'Details of sentence if convicted';


--
-- Name: COLUMN ir_conviction_acquittal.appeal_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_conviction_acquittal.appeal_status IS 'Status of any appeal (Pending, Dismissed, Allowed, etc.)';


--
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
-- Name: TABLE ir_execution_of_nbw; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_execution_of_nbw IS 'Execution of NBW (Non-Bailable Warrant) for each IR record. One record per NBW execution entry.';


--
-- Name: COLUMN ir_execution_of_nbw.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_execution_of_nbw.nbw_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.nbw_number IS 'NBW number/reference';


--
-- Name: COLUMN ir_execution_of_nbw.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.issued_date IS 'Date NBW was issued';


--
-- Name: COLUMN ir_execution_of_nbw.executed_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.executed_date IS 'Date NBW was executed';


--
-- Name: COLUMN ir_execution_of_nbw.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.jurisdiction_ps IS 'Police station where executed';


--
-- Name: COLUMN ir_execution_of_nbw.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.crime_num IS 'Associated crime number';


--
-- Name: COLUMN ir_execution_of_nbw.executed_by; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.executed_by IS 'Name of officer who executed';


--
-- Name: COLUMN ir_execution_of_nbw.place_of_execution; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_execution_of_nbw.place_of_execution IS 'Location of execution';


--
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
-- Name: TABLE ir_indulgance_before_offence; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_indulgance_before_offence IS 'Substances/habits indulged in before offense for each IR record. One record per indulgance entry (junction table for INDULGANCE_BEFORE_OFFENCE array).';


--
-- Name: COLUMN ir_indulgance_before_offence.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_indulgance_before_offence.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_indulgance_before_offence.indulgance; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_indulgance_before_offence.indulgance IS 'Type of indulgance (e.g., alcohol, drugs, etc.)';


--
-- Name: ir_interrogation_report_refs; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_interrogation_report_refs (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    report_ref_id text NOT NULL
);


ALTER TABLE public.ir_interrogation_report_refs OWNER TO cctns_prod;

--
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
-- Name: TABLE ir_jail_sentence; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_jail_sentence IS 'Jail sentence details for each IR record. One record per sentence entry.';


--
-- Name: COLUMN ir_jail_sentence.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_jail_sentence.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.crime_num IS 'Associated crime number';


--
-- Name: COLUMN ir_jail_sentence.sentence_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_type IS 'Type of sentence (RI, SI, etc.)';


--
-- Name: COLUMN ir_jail_sentence.sentence_duration_in_months; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_duration_in_months IS 'Duration in months';


--
-- Name: COLUMN ir_jail_sentence.sentence_start_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_start_date IS 'When sentence started';


--
-- Name: COLUMN ir_jail_sentence.sentence_end_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_end_date IS 'When sentence ended';


--
-- Name: COLUMN ir_jail_sentence.sentence_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.sentence_amount_in_inr IS 'Fine amount in INR if applicable';


--
-- Name: COLUMN ir_jail_sentence.jail_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.jail_name IS 'Name of jail where served';


--
-- Name: COLUMN ir_jail_sentence.date_of_jail_entry; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.date_of_jail_entry IS 'When admitted to jail';


--
-- Name: COLUMN ir_jail_sentence.date_of_jail_release; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_jail_sentence.date_of_jail_release IS 'When released from jail';


--
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
-- Name: ir_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_media (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    media_id text NOT NULL
);


ALTER TABLE public.ir_media OWNER TO cctns_prod;

--
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
-- Name: TABLE ir_new_gang_formation; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_new_gang_formation IS 'New gang formation details for each IR record. One record per gang entry.';


--
-- Name: COLUMN ir_new_gang_formation.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_new_gang_formation.gang_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_name IS 'Name of the gang';


--
-- Name: COLUMN ir_new_gang_formation.gang_formation_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_formation_date IS 'When gang was formed';


--
-- Name: COLUMN ir_new_gang_formation.number_of_members; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.number_of_members IS 'Number of members';


--
-- Name: COLUMN ir_new_gang_formation.leader_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.leader_name IS 'Name of gang leader';


--
-- Name: COLUMN ir_new_gang_formation.leader_person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.leader_person_id IS 'Reference to person_id if leader is in DOPAMS';


--
-- Name: COLUMN ir_new_gang_formation.gang_objective; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.gang_objective IS 'Stated objective of gang';


--
-- Name: COLUMN ir_new_gang_formation.criminal_history; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.criminal_history IS 'Known criminal activities';


--
-- Name: COLUMN ir_new_gang_formation.active; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_new_gang_formation.active IS 'Whether gang is still active';


--
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
-- Name: TABLE ir_pending_nbw; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_pending_nbw IS 'Pending NBW (Non-Bailable Warrant) for each IR record. One record per pending NBW entry.';


--
-- Name: COLUMN ir_pending_nbw.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_pending_nbw.nbw_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.nbw_number IS 'NBW number/reference';


--
-- Name: COLUMN ir_pending_nbw.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.issued_date IS 'Date NBW was issued';


--
-- Name: COLUMN ir_pending_nbw.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.jurisdiction_ps IS 'Police station where issued';


--
-- Name: COLUMN ir_pending_nbw.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.crime_num IS 'Associated crime number';


--
-- Name: COLUMN ir_pending_nbw.reason_for_pending; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.reason_for_pending IS 'Reason why NBW is still pending';


--
-- Name: COLUMN ir_pending_nbw.expected_execution_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_pending_nbw.expected_execution_date IS 'Expected date of execution';


--
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
-- Name: COLUMN ir_previous_offences_confessed.conviction_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.conviction_status IS 'Status of conviction (if relevant to the offense)';


--
-- Name: COLUMN ir_previous_offences_confessed.bail_status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.bail_status IS 'Bail status during this offense';


--
-- Name: COLUMN ir_previous_offences_confessed.court_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.court_name IS 'Court handling the case';


--
-- Name: COLUMN ir_previous_offences_confessed.judge_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_previous_offences_confessed.judge_name IS 'Judge handling the case';


--
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
-- Name: TABLE ir_property_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_property_disposal IS 'Property disposal details for each IR record. One record per disposal entry.';


--
-- Name: COLUMN ir_property_disposal.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_property_disposal.mode_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.mode_of_disposal IS 'How property was disposed (sold, donated, etc.)';


--
-- Name: COLUMN ir_property_disposal.buyer_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.buyer_name IS 'Name of buyer or recipient';


--
-- Name: COLUMN ir_property_disposal.sold_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.sold_amount_in_inr IS 'Amount in INR if sold';


--
-- Name: COLUMN ir_property_disposal.location_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.location_of_disposal IS 'Location where property was disposed';


--
-- Name: COLUMN ir_property_disposal.date_of_disposal; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_property_disposal.date_of_disposal IS 'Date of disposal';


--
-- Name: ir_regular_habits; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.ir_regular_habits (
    id integer NOT NULL,
    interrogation_report_id character varying(50) NOT NULL,
    habit character varying(255) NOT NULL
);


ALTER TABLE public.ir_regular_habits OWNER TO cctns_prod;

--
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
-- Name: TABLE ir_regularization_transit_warrants; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_regularization_transit_warrants IS 'Regularization of transit warrants for each IR record. One record per warrant entry.';


--
-- Name: COLUMN ir_regularization_transit_warrants.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_regularization_transit_warrants.warrant_number; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.warrant_number IS 'Warrant number/reference';


--
-- Name: COLUMN ir_regularization_transit_warrants.warrant_type; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.warrant_type IS 'Type of warrant (NBW, transit, etc.)';


--
-- Name: COLUMN ir_regularization_transit_warrants.issued_date; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.issued_date IS 'Date warrant was issued';


--
-- Name: COLUMN ir_regularization_transit_warrants.jurisdiction_ps; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.jurisdiction_ps IS 'Police station/jurisdiction';


--
-- Name: COLUMN ir_regularization_transit_warrants.crime_num; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.crime_num IS 'Associated crime number';


--
-- Name: COLUMN ir_regularization_transit_warrants.status; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_regularization_transit_warrants.status IS 'Current status (pending, executed, withdrawn, etc.)';


--
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
-- Name: TABLE ir_sureties; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.ir_sureties IS 'Surety information for bail for each IR record. One record per surety entry.';


--
-- Name: COLUMN ir_sureties.interrogation_report_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.interrogation_report_id IS 'Foreign key to interrogation_reports table';


--
-- Name: COLUMN ir_sureties.surety_person_id; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_person_id IS 'Reference to person_id if surety is in DOPAMS';


--
-- Name: COLUMN ir_sureties.surety_name; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_name IS 'Name of surety';


--
-- Name: COLUMN ir_sureties.relation_to_accused; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.relation_to_accused IS 'Relationship to accused (friend, family, etc.)';


--
-- Name: COLUMN ir_sureties.occupation; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.occupation IS 'Occupation of surety';


--
-- Name: COLUMN ir_sureties.surety_amount_in_inr; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.surety_amount_in_inr IS 'Amount of surety in INR';


--
-- Name: COLUMN ir_sureties.date_of_surety; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON COLUMN public.ir_sureties.date_of_surety IS 'Date surety was provided';


--
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
-- Name: VIEW ir_child_table_coverage; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON VIEW public.ir_child_table_coverage IS 'Shows data coverage for all IR related arrays - helps identify which fields are being populated';


--
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
-- Name: ir_consumer_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_consumer_details_id_seq OWNED BY public.ir_consumer_details.id;


--
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
-- Name: ir_conviction_acquittal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_conviction_acquittal_id_seq OWNED BY public.ir_conviction_acquittal.id;


--
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
-- Name: ir_defence_counsel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_defence_counsel_id_seq OWNED BY public.ir_defence_counsel.id;


--
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
-- Name: ir_dopams_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_dopams_links_id_seq OWNED BY public.ir_dopams_links.id;


--
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
-- Name: ir_execution_of_nbw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_execution_of_nbw_id_seq OWNED BY public.ir_execution_of_nbw.id;


--
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
-- Name: ir_family_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_family_history_id_seq OWNED BY public.ir_family_history.id;


--
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
-- Name: VIEW ir_field_persistence_check; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON VIEW public.ir_field_persistence_check IS 'Validates API field to DB persistence mapping - shows which fields are being stored and frequency of non-null values';


--
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
-- Name: ir_financial_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_financial_history_id_seq OWNED BY public.ir_financial_history.id;


--
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
-- Name: ir_indulgance_before_offence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_indulgance_before_offence_id_seq OWNED BY public.ir_indulgance_before_offence.id;


--
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
-- Name: ir_interrogation_report_refs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_interrogation_report_refs_id_seq OWNED BY public.ir_interrogation_report_refs.id;


--
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
-- Name: ir_jail_sentence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_jail_sentence_id_seq OWNED BY public.ir_jail_sentence.id;


--
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
-- Name: ir_local_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_local_contacts_id_seq OWNED BY public.ir_local_contacts.id;


--
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
-- Name: ir_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_media_id_seq OWNED BY public.ir_media.id;


--
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
-- Name: ir_modus_operandi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_modus_operandi_id_seq OWNED BY public.ir_modus_operandi.id;


--
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
-- Name: ir_new_gang_formation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_new_gang_formation_id_seq OWNED BY public.ir_new_gang_formation.id;


--
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
-- Name: ir_pending_fk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_pending_fk_id_seq OWNED BY public.ir_pending_fk.id;


--
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
-- Name: ir_pending_nbw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_pending_nbw_id_seq OWNED BY public.ir_pending_nbw.id;


--
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
-- Name: ir_previous_offences_confessed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_previous_offences_confessed_id_seq OWNED BY public.ir_previous_offences_confessed.id;


--
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
-- Name: ir_property_disposal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_property_disposal_id_seq OWNED BY public.ir_property_disposal.id;


--
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
-- Name: ir_regular_habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_regular_habits_id_seq OWNED BY public.ir_regular_habits.id;


--
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
-- Name: ir_regularization_transit_warrants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_regularization_transit_warrants_id_seq OWNED BY public.ir_regularization_transit_warrants.id;


--
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
-- Name: ir_shelter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_shelter_id_seq OWNED BY public.ir_shelter.id;


--
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
-- Name: ir_sim_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_sim_details_id_seq OWNED BY public.ir_sim_details.id;


--
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
-- Name: ir_sureties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_sureties_id_seq OWNED BY public.ir_sureties.id;


--
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
-- Name: ir_types_of_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ir_types_of_drugs_id_seq OWNED BY public.ir_types_of_drugs.id;


--
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
-- Name: mo_seizure_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.mo_seizure_media_id_seq OWNED BY public.mo_seizure_media.id;


--
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
-- Name: TABLE persons; Type: COMMENT; Schema: public; Owner: cctns_prod
--

COMMENT ON TABLE public.persons IS 'Personal details of individuals (accused, victims, witnesses, etc.)';


--
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
-- Name: properties_pending_fk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.properties_pending_fk_id_seq OWNED BY public.properties_pending_fk.id;


--
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
-- Name: ssor_kb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.ssor_kb_id_seq OWNED BY public.ssor_kb.id;


--
-- Name: stolen_automobile_media; Type: TABLE; Schema: public; Owner: cctns_prod
--

CREATE TABLE public.stolen_automobile_media (
    id bigint NOT NULL,
    stolen_property_id character varying(50) NOT NULL,
    media_ref text
);


ALTER TABLE public.stolen_automobile_media OWNER TO cctns_prod;

--
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
-- Name: stolen_automobile_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cctns_prod
--

ALTER SEQUENCE public.stolen_automobile_media_id_seq OWNED BY public.stolen_automobile_media.id;


--
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
-- Name: charge_sheet_updates id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates ALTER COLUMN id SET DEFAULT nextval('public.charge_sheet_updates_id_seq'::regclass);


--
-- Name: fpb_accused fpb_accused_id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused ALTER COLUMN fpb_accused_id SET DEFAULT nextval('public.fpb_accused_fpb_accused_id_seq'::regclass);


--
-- Name: fpb_additional_crimes id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_additional_crimes ALTER COLUMN id SET DEFAULT nextval('public.fpb_additional_crimes_id_seq'::regclass);


--
-- Name: ir_associate_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_associate_details ALTER COLUMN id SET DEFAULT nextval('public.ir_associate_details_id_seq'::regclass);


--
-- Name: ir_consumer_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_consumer_details ALTER COLUMN id SET DEFAULT nextval('public.ir_consumer_details_id_seq'::regclass);


--
-- Name: ir_conviction_acquittal id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_conviction_acquittal ALTER COLUMN id SET DEFAULT nextval('public.ir_conviction_acquittal_id_seq'::regclass);


--
-- Name: ir_defence_counsel id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_defence_counsel ALTER COLUMN id SET DEFAULT nextval('public.ir_defence_counsel_id_seq'::regclass);


--
-- Name: ir_dopams_links id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_dopams_links ALTER COLUMN id SET DEFAULT nextval('public.ir_dopams_links_id_seq'::regclass);


--
-- Name: ir_execution_of_nbw id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_execution_of_nbw ALTER COLUMN id SET DEFAULT nextval('public.ir_execution_of_nbw_id_seq'::regclass);


--
-- Name: ir_family_history id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_family_history ALTER COLUMN id SET DEFAULT nextval('public.ir_family_history_id_seq'::regclass);


--
-- Name: ir_financial_history id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_financial_history ALTER COLUMN id SET DEFAULT nextval('public.ir_financial_history_id_seq'::regclass);


--
-- Name: ir_indulgance_before_offence id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_indulgance_before_offence ALTER COLUMN id SET DEFAULT nextval('public.ir_indulgance_before_offence_id_seq'::regclass);


--
-- Name: ir_interrogation_report_refs id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_interrogation_report_refs ALTER COLUMN id SET DEFAULT nextval('public.ir_interrogation_report_refs_id_seq'::regclass);


--
-- Name: ir_jail_sentence id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_jail_sentence ALTER COLUMN id SET DEFAULT nextval('public.ir_jail_sentence_id_seq'::regclass);


--
-- Name: ir_local_contacts id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_local_contacts ALTER COLUMN id SET DEFAULT nextval('public.ir_local_contacts_id_seq'::regclass);


--
-- Name: ir_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_media ALTER COLUMN id SET DEFAULT nextval('public.ir_media_id_seq'::regclass);


--
-- Name: ir_modus_operandi id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_modus_operandi ALTER COLUMN id SET DEFAULT nextval('public.ir_modus_operandi_id_seq'::regclass);


--
-- Name: ir_new_gang_formation id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_new_gang_formation ALTER COLUMN id SET DEFAULT nextval('public.ir_new_gang_formation_id_seq'::regclass);


--
-- Name: ir_pending_fk id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_fk ALTER COLUMN id SET DEFAULT nextval('public.ir_pending_fk_id_seq'::regclass);


--
-- Name: ir_pending_nbw id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_nbw ALTER COLUMN id SET DEFAULT nextval('public.ir_pending_nbw_id_seq'::regclass);


--
-- Name: ir_previous_offences_confessed id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_previous_offences_confessed ALTER COLUMN id SET DEFAULT nextval('public.ir_previous_offences_confessed_id_seq'::regclass);


--
-- Name: ir_property_disposal id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_property_disposal ALTER COLUMN id SET DEFAULT nextval('public.ir_property_disposal_id_seq'::regclass);


--
-- Name: ir_regular_habits id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regular_habits ALTER COLUMN id SET DEFAULT nextval('public.ir_regular_habits_id_seq'::regclass);


--
-- Name: ir_regularization_transit_warrants id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regularization_transit_warrants ALTER COLUMN id SET DEFAULT nextval('public.ir_regularization_transit_warrants_id_seq'::regclass);


--
-- Name: ir_shelter id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_shelter ALTER COLUMN id SET DEFAULT nextval('public.ir_shelter_id_seq'::regclass);


--
-- Name: ir_sim_details id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sim_details ALTER COLUMN id SET DEFAULT nextval('public.ir_sim_details_id_seq'::regclass);


--
-- Name: ir_sureties id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sureties ALTER COLUMN id SET DEFAULT nextval('public.ir_sureties_id_seq'::regclass);


--
-- Name: ir_types_of_drugs id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_types_of_drugs ALTER COLUMN id SET DEFAULT nextval('public.ir_types_of_drugs_id_seq'::regclass);


--
-- Name: mo_seizure_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.mo_seizure_media ALTER COLUMN id SET DEFAULT nextval('public.mo_seizure_media_id_seq'::regclass);


--
-- Name: properties_pending_fk id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties_pending_fk ALTER COLUMN id SET DEFAULT nextval('public.properties_pending_fk_id_seq'::regclass);


--
-- Name: ssor_kb id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb ALTER COLUMN id SET DEFAULT nextval('public.ssor_kb_id_seq'::regclass);


--
-- Name: stolen_automobile_media id; Type: DEFAULT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobile_media ALTER COLUMN id SET DEFAULT nextval('public.stolen_automobile_media_id_seq'::regclass);


--
-- Name: charge_sheet_updates charge_sheet_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates
    ADD CONSTRAINT charge_sheet_updates_pkey PRIMARY KEY (id);


--
-- Name: charge_sheet_updates charge_sheet_updates_update_charge_sheet_id_key; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.charge_sheet_updates
    ADD CONSTRAINT charge_sheet_updates_update_charge_sheet_id_key UNIQUE (update_charge_sheet_id);


--
-- Name: etl_run_state etl_run_state_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.etl_run_state
    ADD CONSTRAINT etl_run_state_pkey PRIMARY KEY (module_name);


--
-- Name: fpb_accused fpb_accused_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused
    ADD CONSTRAINT fpb_accused_pkey PRIMARY KEY (fpb_accused_id);


--
-- Name: fpb_additional_crimes fpb_additional_crimes_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_additional_crimes
    ADD CONSTRAINT fpb_additional_crimes_pkey PRIMARY KEY (id);


--
-- Name: ir_conviction_acquittal ir_conviction_acquittal_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_conviction_acquittal
    ADD CONSTRAINT ir_conviction_acquittal_pkey PRIMARY KEY (id);


--
-- Name: ir_defence_counsel ir_defence_counsel_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_defence_counsel
    ADD CONSTRAINT ir_defence_counsel_pkey PRIMARY KEY (id);


--
-- Name: ir_execution_of_nbw ir_execution_of_nbw_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_execution_of_nbw
    ADD CONSTRAINT ir_execution_of_nbw_pkey PRIMARY KEY (id);


--
-- Name: ir_jail_sentence ir_jail_sentence_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_jail_sentence
    ADD CONSTRAINT ir_jail_sentence_pkey PRIMARY KEY (id);


--
-- Name: ir_new_gang_formation ir_new_gang_formation_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_new_gang_formation
    ADD CONSTRAINT ir_new_gang_formation_pkey PRIMARY KEY (id);


--
-- Name: ir_pending_fk ir_pending_fk_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_fk
    ADD CONSTRAINT ir_pending_fk_pkey PRIMARY KEY (id);


--
-- Name: ir_pending_nbw ir_pending_nbw_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_pending_nbw
    ADD CONSTRAINT ir_pending_nbw_pkey PRIMARY KEY (id);


--
-- Name: ir_property_disposal ir_property_disposal_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_property_disposal
    ADD CONSTRAINT ir_property_disposal_pkey PRIMARY KEY (id);


--
-- Name: ir_regularization_transit_warrants ir_regularization_transit_warrants_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_regularization_transit_warrants
    ADD CONSTRAINT ir_regularization_transit_warrants_pkey PRIMARY KEY (id);


--
-- Name: ir_sureties ir_sureties_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ir_sureties
    ADD CONSTRAINT ir_sureties_pkey PRIMARY KEY (id);


--
-- Name: mo_seizure_media mo_seizure_media_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.mo_seizure_media
    ADD CONSTRAINT mo_seizure_media_pkey PRIMARY KEY (id);


--
-- Name: accused pk_accused_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.accused
    ADD CONSTRAINT pk_accused_id PRIMARY KEY (accused_id);


--
-- Name: crimes pk_crimes_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.crimes
    ADD CONSTRAINT pk_crimes_id PRIMARY KEY (crime_id);


--
-- Name: interrogation_reports pk_ir_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.interrogation_reports
    ADD CONSTRAINT pk_ir_id PRIMARY KEY (interrogation_report_id);


--
-- Name: persons pk_persons_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT pk_persons_id PRIMARY KEY (person_id);


--
-- Name: properties pk_properties_id; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT pk_properties_id PRIMARY KEY (property_id);


--
-- Name: properties_pending_fk properties_pending_fk_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.properties_pending_fk
    ADD CONSTRAINT properties_pending_fk_pkey PRIMARY KEY (id);


--
-- Name: property_additional_details property_additional_details_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.property_additional_details
    ADD CONSTRAINT property_additional_details_pkey PRIMARY KEY (property_id);


--
-- Name: property_media property_media_unique_entry; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_unique_entry UNIQUE (property_id, media_index);


--
-- Name: ssor_kb ssor_kb_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb
    ADD CONSTRAINT ssor_kb_pkey PRIMARY KEY (id);


--
-- Name: stolen_automobile_media stolen_automobile_media_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobile_media
    ADD CONSTRAINT stolen_automobile_media_pkey PRIMARY KEY (id);


--
-- Name: stolen_automobiles stolen_automobiles_pkey; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobiles
    ADD CONSTRAINT stolen_automobiles_pkey PRIMARY KEY (stolen_property_id);


--
-- Name: disposal uk_disposal_composite; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.disposal
    ADD CONSTRAINT uk_disposal_composite UNIQUE (crime_id, disposal_type, disposed_at);


--
-- Name: fpb_accused uq_fpb_accused_fir_ps_name; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused
    ADD CONSTRAINT uq_fpb_accused_fir_ps_name UNIQUE (fir_num, ps_code, full_name);


--
-- Name: ssor_kb uq_ssor_kb_section; Type: CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.ssor_kb
    ADD CONSTRAINT uq_ssor_kb_section UNIQUE (act_name, section_code);


--
-- Name: idx_crimes_coalesce_date; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_coalesce_date ON public.crimes USING btree (COALESCE(date_modified, date_created) DESC NULLS LAST);


--
-- Name: idx_crimes_date_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_date_created ON public.crimes USING btree (date_created DESC NULLS LAST);


--
-- Name: idx_crimes_date_modified_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_crimes_date_modified_created ON public.crimes USING btree (date_modified DESC NULLS LAST, date_created DESC NULLS LAST);


--
-- Name: idx_fpb_accused_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_accused_crime_id ON public.fpb_accused USING btree (crime_id);


--
-- Name: idx_fpb_accused_fir_ps; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_accused_fir_ps ON public.fpb_accused USING btree (fir_num, ps_code);


--
-- Name: idx_fpb_additional_crimes_parent; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fpb_additional_crimes_parent ON public.fpb_additional_crimes USING btree (fpb_accused_id);


--
-- Name: idx_fsl_created; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_created ON public.fsl_case_property USING btree (date_created DESC NULLS LAST);


--
-- Name: idx_fsl_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_crime_id ON public.fsl_case_property USING btree (crime_id);


--
-- Name: idx_fsl_mo_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_mo_id ON public.fsl_case_property USING btree (mo_id);


--
-- Name: idx_fsl_status; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_fsl_status ON public.fsl_case_property USING btree (status);


--
-- Name: idx_ir_associate_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_associate_details_ir_id ON public.ir_associate_details USING btree (interrogation_report_id);


--
-- Name: idx_ir_consumer_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_consumer_details_ir_id ON public.ir_consumer_details USING btree (interrogation_report_id);


--
-- Name: idx_ir_conviction_acquittal_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_conviction_acquittal_ir_id ON public.ir_conviction_acquittal USING btree (interrogation_report_id);


--
-- Name: idx_ir_defence_counsel_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_defence_counsel_ir_id ON public.ir_defence_counsel USING btree (interrogation_report_id);


--
-- Name: idx_ir_defence_counsel_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_defence_counsel_person_id ON public.ir_defence_counsel USING btree (defence_counsel_person_id);


--
-- Name: idx_ir_dopams_links_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_dopams_links_ir_id ON public.ir_dopams_links USING btree (interrogation_report_id);


--
-- Name: idx_ir_execution_of_nbw_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_execution_of_nbw_ir_id ON public.ir_execution_of_nbw USING btree (interrogation_report_id);


--
-- Name: idx_ir_family_history_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_family_history_ir_id ON public.ir_family_history USING btree (interrogation_report_id);


--
-- Name: idx_ir_financial_history_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_financial_history_ir_id ON public.ir_financial_history USING btree (interrogation_report_id);


--
-- Name: idx_ir_indulgance_before_offence_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_indulgance_before_offence_ir_id ON public.ir_indulgance_before_offence USING btree (interrogation_report_id);


--
-- Name: idx_ir_interrogation_report_refs_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_interrogation_report_refs_ir_id ON public.ir_interrogation_report_refs USING btree (interrogation_report_id);


--
-- Name: idx_ir_jail_sentence_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_jail_sentence_ir_id ON public.ir_jail_sentence USING btree (interrogation_report_id);


--
-- Name: idx_ir_local_contacts_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_local_contacts_ir_id ON public.ir_local_contacts USING btree (interrogation_report_id);


--
-- Name: idx_ir_media_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_media_ir_id ON public.ir_media USING btree (interrogation_report_id);


--
-- Name: idx_ir_modus_operandi_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_modus_operandi_ir_id ON public.ir_modus_operandi USING btree (interrogation_report_id);


--
-- Name: idx_ir_new_gang_formation_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_new_gang_formation_ir_id ON public.ir_new_gang_formation USING btree (interrogation_report_id);


--
-- Name: idx_ir_new_gang_formation_leader_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_new_gang_formation_leader_person_id ON public.ir_new_gang_formation USING btree (leader_person_id);


--
-- Name: idx_ir_pending_nbw_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_pending_nbw_ir_id ON public.ir_pending_nbw USING btree (interrogation_report_id);


--
-- Name: idx_ir_previous_offences_confessed_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_previous_offences_confessed_ir_id ON public.ir_previous_offences_confessed USING btree (interrogation_report_id);


--
-- Name: idx_ir_property_disposal_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_property_disposal_ir_id ON public.ir_property_disposal USING btree (interrogation_report_id);


--
-- Name: idx_ir_regular_habits_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_regular_habits_ir_id ON public.ir_regular_habits USING btree (interrogation_report_id);


--
-- Name: idx_ir_regularization_transit_warrants_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_regularization_transit_warrants_ir_id ON public.ir_regularization_transit_warrants USING btree (interrogation_report_id);


--
-- Name: idx_ir_reports_created_modified; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_reports_created_modified ON public.interrogation_reports USING btree (date_created, date_modified);


--
-- Name: idx_ir_reports_crime_person; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_reports_crime_person ON public.interrogation_reports USING btree (crime_id, person_id);


--
-- Name: idx_ir_shelter_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_shelter_ir_id ON public.ir_shelter USING btree (interrogation_report_id);


--
-- Name: idx_ir_sim_details_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sim_details_ir_id ON public.ir_sim_details USING btree (interrogation_report_id);


--
-- Name: idx_ir_sureties_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sureties_ir_id ON public.ir_sureties USING btree (interrogation_report_id);


--
-- Name: idx_ir_sureties_surety_person_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_sureties_surety_person_id ON public.ir_sureties USING btree (surety_person_id);


--
-- Name: idx_ir_types_of_drugs_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_ir_types_of_drugs_ir_id ON public.ir_types_of_drugs USING btree (interrogation_report_id);


--
-- Name: idx_pending_fk_ir_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX idx_pending_fk_ir_id ON public.ir_pending_fk USING btree (ir_id) WHERE (NOT resolved);


--
-- Name: idx_pending_fk_property_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE UNIQUE INDEX idx_pending_fk_property_id ON public.properties_pending_fk USING btree (property_id) WHERE (NOT resolved);


--
-- Name: idx_stolen_automobile_media_parent; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobile_media_parent ON public.stolen_automobile_media USING btree (stolen_property_id);


--
-- Name: idx_stolen_automobiles_crime_id; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobiles_crime_id ON public.stolen_automobiles USING btree (crime_id);


--
-- Name: idx_stolen_automobiles_date_modified; Type: INDEX; Schema: public; Owner: cctns_prod
--

CREATE INDEX idx_stolen_automobiles_date_modified ON public.stolen_automobiles USING btree (date_modified);


--
-- Name: fpb_accused fk_fpb_accused_crime; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_accused
    ADD CONSTRAINT fk_fpb_accused_crime FOREIGN KEY (crime_id) REFERENCES public.crimes(crime_id);


--
-- Name: fpb_additional_crimes fk_fpb_additional_crimes_parent; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.fpb_additional_crimes
    ADD CONSTRAINT fk_fpb_additional_crimes_parent FOREIGN KEY (fpb_accused_id) REFERENCES public.fpb_accused(fpb_accused_id) ON DELETE CASCADE;


--
-- Name: stolen_automobile_media fk_stolen_automobile_media_parent; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobile_media
    ADD CONSTRAINT fk_stolen_automobile_media_parent FOREIGN KEY (stolen_property_id) REFERENCES public.stolen_automobiles(stolen_property_id) ON DELETE CASCADE;


--
-- Name: stolen_automobiles fk_stolen_automobiles_crime; Type: FK CONSTRAINT; Schema: public; Owner: cctns_prod
--

ALTER TABLE ONLY public.stolen_automobiles
    ADD CONSTRAINT fk_stolen_automobiles_crime FOREIGN KEY (crime_id) REFERENCES public.crimes(crime_id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: cctns_prod
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict vnTf0g8jnDHgP8NdFfK65s9pXER3chlwozJVahnaMcS33fecbokaOz1gGkqNyzt

