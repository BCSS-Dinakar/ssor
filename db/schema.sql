-- =============================================================================
-- CCTNS-V2 Data Relay - Relational Schema (PostgreSQL)
-- =============================================================================
-- Derived from api-1.yaml (OpenAPI 3.1 "CCTNS-V2 Data Relay API").
--
-- Conventions
--   * Source system is MongoDB: every business id is a 24-char hex ObjectId
--     (spec pattern ^[\dA-Fa-f]+$). These are preserved as VARCHAR(24).
--   * Fully normalized: 1:M arrays become child tables; scalar 1:1 nested
--     objects are inlined as prefixed columns (e.g. gd_*, occurrence_*, pf_*).
--   * Fields the spec marks "PRIMARY KEY" / "FOREIGN KEY" drive the key design.
--   * Undefined nested item schemas are stored as JSONB.
--   * "list" and "/{crimeId}" endpoint pairs share a schema -> one table each.
--
-- Endpoint -> Table map
--   master-data/hierarchy .............. police_station
--   files/{fileId} ..................... file
--   person-details/{personId} .......... person (+ person_identity_detail, person_media)
--   crimes ............................. crime
--   crimes/disposal .................... crime_disposal
--   accused ............................ accused
--   arrests ............................ arrest
--   mo-seizures ........................ mo_seizure
--   case-property ...................... case_property (+ case_property_media)
--   property-details ................... property (+ property_media, property_details_*)
--   chargesheets ....................... chargesheet (+ chargesheet_accused_particular, chargesheet_act_section)
--   update-chargesheets ................ update_chargesheet
--   interrogation-reports/v1 ........... interrogation_report (+ ir_* children)
--   fpb/accused, fpb/accused/pcn ....... fpb_accused (+ fpb_additional_crime)
--   reports/stolen-automobiles ......... stolen_automobile (+ stolen_automobile_media)
--   reports/missing-udb-persons ........ v_missing_udb_persons (view)
--   reports/arrest/arrest-particulars .. v_arrest_particulars (view)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. MASTER / CORE
-- =============================================================================

-- files/{fileId} : central file/media registry referenced by FILE_ID everywhere
CREATE TABLE file (
    file_id       VARCHAR(24) PRIMARY KEY,
    name          TEXT,
    mime_type     TEXT,
    url           TEXT,
    category      TEXT,
    date_uploaded TIMESTAMP
);

-- master-data/hierarchy : police station org hierarchy. PK PS_CODE.
CREATE TABLE police_station (
    ps_code        VARCHAR(64) PRIMARY KEY,
    ps_name        TEXT,
    adg_code       VARCHAR(64),
    adg_name       TEXT,
    zone_code      VARCHAR(64),
    zone_name      TEXT,
    range_code     VARCHAR(64),
    range_name     TEXT,
    sub_zone_code  VARCHAR(64),
    sub_zone_name  TEXT,
    dist_code      VARCHAR(64),
    dist_name      TEXT,
    sdpo_code      VARCHAR(64),
    sdpo_name      TEXT,
    circle_code    VARCHAR(64),
    circle_name    TEXT
);

-- person-details/{personId} : PK PERSON_ID. Inlines PERSONAL_DETAILS,
-- CONTACT_DETAILS, PRESENT_ADDRESS. Children: identity details, media.
CREATE TABLE person (
    person_id                VARCHAR(24) PRIMARY KEY,
    date_created             TIMESTAMP,
    date_modified            TIMESTAMP,
    -- PERSONAL_DETAILS
    age                      NUMERIC,
    alias                    TEXT,
    caste                    TEXT,
    date_of_birth            DATE,
    designation              TEXT,
    education_qualification  TEXT,
    full_name                TEXT,
    gender                   TEXT,
    is_died                  BOOLEAN,
    name                     TEXT,
    nationality              TEXT,
    occupation               TEXT,
    place_of_work            TEXT,
    relation_type            TEXT,
    relative_name            TEXT,
    religion                 TEXT,
    sub_caste                TEXT,
    surname                  TEXT,
    -- CONTACT_DETAILS
    contact_country_code     TEXT,
    contact_email_id         TEXT,
    contact_phone_number     TEXT,
    -- PRESENT_ADDRESS
    pa_area_mandal           TEXT,
    pa_country               TEXT,
    pa_district              TEXT,
    pa_house_no              TEXT,
    pa_jurisdiction_ps       TEXT,
    pa_landmark_milestone    TEXT,
    pa_locality_village      TEXT,
    pa_pin_code              TEXT,
    pa_residency_type        TEXT,
    pa_state_ut              TEXT,
    pa_street_road_no        TEXT,
    pa_ward_colony           TEXT
);

-- person.IDENTITY_DETAILS[] (1:M)
CREATE TABLE person_identity_detail (
    id         BIGSERIAL PRIMARY KEY,
    person_id  VARCHAR(24) NOT NULL,
    file_id    VARCHAR(24),
    number     TEXT,
    type       TEXT
);

-- person.MEDIA[] (1:M, array of string references)
CREATE TABLE person_media (
    id         BIGSERIAL PRIMARY KEY,
    person_id  VARCHAR(24) NOT NULL,
    media_ref  TEXT
);

-- =============================================================================
-- 2. CRIME CLUSTER
-- =============================================================================

-- crimes : PK CRIME_ID. FK PS_CODE, FK COMPLAINANT_ID. Inlines GD,
-- OCCURRENCE_DATE, PLACE_OF_OFFENCE.
CREATE TABLE crime (
    crime_id                    VARCHAR(24) PRIMARY KEY,
    acts_sections               TEXT,
    brief_facts                 TEXT,
    case_status                 TEXT,
    complainant_id              VARCHAR(24),
    court_name                  TEXT,
    crime_type                  TEXT,
    date_created                TIMESTAMP,
    date_modified               TIMESTAMP,
    fir_copy                    TEXT,
    fir_date                    DATE,
    fir_num                     TEXT,
    fir_reg_num                 TEXT,
    fir_type                    TEXT,
    io_mobile                   TEXT,
    io_name                     TEXT,
    io_rank                     TEXT,
    major_head                  TEXT,
    minor_head                  TEXT,
    ps_code                     VARCHAR(64),
    -- GD
    gd_entry_date               TIMESTAMP,
    gd_entry_num                TEXT,
    gd_entry_type               TEXT,
    -- OCCURRENCE_DATE
    occurrence_from_date        TIMESTAMP,
    occurrence_prior_to_date    TIMESTAMP,
    occurrence_to_date          TIMESTAMP,
    -- PLACE_OF_OFFENCE
    poo_area_mandal             TEXT,
    poo_beat_no                 TEXT,
    poo_district                TEXT,
    poo_house_no                TEXT,
    poo_jurisdiction_ps         TEXT,
    poo_landmark_milestone      TEXT,
    poo_latitude                TEXT,
    poo_limits                  TEXT,
    poo_longitude               TEXT,
    poo_pin_code                TEXT,
    poo_state_ut                TEXT,
    poo_street_road_no          TEXT,
    poo_ward_colony             TEXT
);

-- crimes/disposal : 1:1 with crime, keyed by CRIME_ID.
CREATE TABLE crime_disposal (
    crime_id       VARCHAR(24) PRIMARY KEY,
    case_status    TEXT,
    disposal       TEXT,
    disposal_type  TEXT,
    disposed_date  TIMESTAMP
);

-- accused : PK ACCUSED_ID. FK CRIME_ID, PERSON_ID. Inlines PHYSICAL_FEATURES.
CREATE TABLE accused (
    accused_id       VARCHAR(24) PRIMARY KEY,
    accused_code     TEXT,
    accused_status   TEXT,
    crime_id         VARCHAR(24) NOT NULL,
    person_id        VARCHAR(24),
    is_ccl           BOOLEAN,
    seq_num          TEXT,
    type             TEXT,
    -- PHYSICAL_FEATURES
    pf_beard         TEXT,
    pf_build         TEXT,
    pf_color         TEXT,
    pf_ear           TEXT,
    pf_eyes          TEXT,
    pf_face          TEXT,
    pf_hair          TEXT,
    pf_height        TEXT,
    pf_leucoderma    TEXT,
    pf_mole          TEXT,
    pf_mustache      TEXT,
    pf_nose          TEXT,
    pf_teeth         TEXT
);

-- arrests : no spec PK -> surrogate PK; unique on (crime, person, seq).
CREATE TABLE arrest (
    arrest_id                 BIGSERIAL PRIMARY KEY,
    crime_id                  VARCHAR(24) NOT NULL,
    person_id                 VARCHAR(24),
    accused_code              TEXT,
    accused_seq_no            TEXT,
    accused_type              TEXT,
    arrested_date             TIMESTAMP,
    date_of_issue_41a         TIMESTAMP,
    is_41a_crpc               BOOLEAN,
    is_41a_explain_submitted  BOOLEAN,
    is_absconding             BOOLEAN,
    is_apprehended            BOOLEAN,
    is_arrested               BOOLEAN,
    is_ccl                    BOOLEAN,
    is_died                   BOOLEAN,
    CONSTRAINT uq_arrest UNIQUE (crime_id, person_id, accused_seq_no)
);

-- mo-seizures : PK MO_SEIZURE_ID. FK CRIME_ID.
CREATE TABLE mo_seizure (
    mo_seizure_id         VARCHAR(24) PRIMARY KEY,
    crime_id              VARCHAR(24) NOT NULL,
    date_created          TIMESTAMP,
    date_modified         TIMESTAMP,
    description           TEXT,
    mo_id                 VARCHAR(24),
    mo_media_category     TEXT,
    mo_media_file_id      VARCHAR(24),
    mo_media_name         TEXT,
    mo_media_type         TEXT,
    mo_media_url          TEXT,
    pos_address1          TEXT,
    pos_address2          TEXT,
    pos_city              TEXT,
    pos_description       TEXT,
    pos_district          TEXT,
    pos_landmark          TEXT,
    pos_latitude          NUMERIC,
    pos_longitude         NUMERIC,
    pos_pincode           TEXT,
    seized_by             TEXT,
    seized_date           TIMESTAMP,
    seized_from           TEXT,
    seq_no                NUMERIC,
    strength_of_evidence  TEXT,
    sub_type              TEXT,
    type                  TEXT
);

-- =============================================================================
-- 3. PROPERTY CLUSTER
-- =============================================================================

-- case-property : PK CASE_PROPERTY_ID. FK CRIME_ID, MO_ID. (created before
-- property because property.case_property_id references it.)
CREATE TABLE case_property (
    case_property_id        VARCHAR(24) PRIMARY KEY,
    crime_id                VARCHAR(24),
    mo_id                   VARCHAR(24),
    assign_custody          TEXT,
    case_type               TEXT,
    court_name              TEXT,
    court_order_date        TIMESTAMP,
    court_order_number      NUMERIC,
    cpr_court_name          TEXT,
    cpr_no                  TEXT,
    date_created            TIMESTAMP,
    date_custody            TIMESTAMP,
    date_disposal           TIMESTAMP,
    date_modified           TIMESTAMP,
    date_sent_to_expert     TIMESTAMP,
    details_disposal        TEXT,
    direction_by_court      TEXT,
    expert_type             TEXT,
    forwarding_through      TEXT,
    fsl_court_name          TEXT,
    fsl_date                TIMESTAMP,
    fsl_no                  TEXT,
    fsl_request_id          VARCHAR(24),
    opinion                 TEXT,
    opinion_furnished       TEXT,
    other_expert_type       TEXT,
    place_custody           TEXT,
    place_disposal          TEXT,
    property_received_back   BOOLEAN,
    release_date            TIMESTAMP,
    release_order_no        TEXT,
    report_received         BOOLEAN,
    return_date             TIMESTAMP,
    send_date               TIMESTAMP,
    status                  TEXT,
    strength_of_evidence    TEXT
);

-- case_property.MEDIA[] (1:M, {FILE_ID})
CREATE TABLE case_property_media (
    id                BIGSERIAL PRIMARY KEY,
    case_property_id  VARCHAR(24) NOT NULL,
    file_id           VARCHAR(24)
);

-- property-details : PK PROPERTY_ID. FK CRIME_ID, CASE_PROPERTY_ID.
-- Common fields; category-specific attributes live in property_details_* tables.
CREATE TABLE property (
    property_id             VARCHAR(24) PRIMARY KEY,
    crime_id                VARCHAR(24) NOT NULL,
    case_property_id        VARCHAR(24),
    belongs                 TEXT,
    category                TEXT,
    date_created            TIMESTAMP,
    date_modified           TIMESTAMP,
    date_of_seizure         TIMESTAMP,
    estimate_value          NUMERIC,
    nature                  TEXT,
    particular_of_property  TEXT,
    place_of_recovery       TEXT,
    property_status         TEXT,
    recovered_from          TEXT,
    recovered_value         NUMERIC,
    CONSTRAINT chk_property_status CHECK (
        property_status IS NULL OR property_status IN
        ('Involved','Lost','Others','Recovered','Seized','Stolen')
    ),
    CONSTRAINT chk_recovered_from CHECK (
        recovered_from IS NULL OR recovered_from IN
        ('','Abandoned','Accused','Others','Professional Receiver')
    )
);

-- property.MEDIA[] (1:M, array of string references)
CREATE TABLE property_media (
    id           BIGSERIAL PRIMARY KEY,
    property_id  VARCHAR(24) NOT NULL,
    media_ref    TEXT
);

-- property ADDITIONAL_DETAILS per CATEGORY (each 1:1 with property)
CREATE TABLE property_details_drugs (
    property_id             VARCHAR(24) PRIMARY KEY,
    agency_name             TEXT,
    area_acres              NUMERIC,
    cultivation_type        TEXT,
    description_of_packing  TEXT,
    drug_particulars        TEXT,
    gang_name               TEXT,
    location_type           TEXT,
    no_of_packets           NUMERIC,
    optimum_area            NUMERIC,
    other                   TEXT,
    place_type              TEXT,
    plants_number           NUMERIC,
    potential_yields        NUMERIC,
    remarks                 TEXT,
    specification_of_drug   TEXT,
    weight                  NUMERIC,
    weight_in               TEXT,
    whether_accused         BOOLEAN,
    whether_addict          BOOLEAN,
    whether_carrier         BOOLEAN,
    whether_detained        BOOLEAN,
    whether_drug_syndicate  BOOLEAN,
    whether_emergency       BOOLEAN,
    whether_interrogation   BOOLEAN,
    whether_lab             BOOLEAN,
    whether_notice          BOOLEAN,
    whether_peddler         BOOLEAN,
    whether_trafficker      BOOLEAN
);

CREATE TABLE property_details_cultural (
    property_id               VARCHAR(24) PRIMARY KEY,
    age_adbc                  TEXT,
    asi_certificate_no        TEXT,
    breadth                   NUMERIC,
    depth                     NUMERIC,
    height                    NUMERIC,
    insurance_certificate_no  TEXT,
    material                  TEXT,
    name_of_insurance         TEXT,
    nomenclature              TEXT,
    photograph_collected      TEXT,
    remarks                   TEXT,
    special_details           TEXT,
    weight                    NUMERIC
);

CREATE TABLE property_details_arms (
    property_id                      VARCHAR(24) PRIMARY KEY,
    arms_category                    TEXT,
    bore                             TEXT,
    country_of_design                TEXT,
    destroyed                        BOOLEAN,
    insurance_certificate_no         TEXT,
    is_manufacturing_unit            BOOLEAN,
    licence_issued_by                TEXT,
    licence_no                       TEXT,
    licensed                         BOOLEAN,
    made                             TEXT,
    manufacturer                     TEXT,
    manufacturing_unit_name          TEXT,
    model                            TEXT,
    name_of_insurance_company        TEXT,
    quantity                         TEXT,
    remarks                          TEXT,
    sent_to_fsl                      BOOLEAN,
    source_of_arm                    TEXT,
    special_marks_of_identification  TEXT,
    weapon_number                    TEXT
);

CREATE TABLE property_details_coins_currency (
    property_id                   VARCHAR(24) PRIMARY KEY,
    ashoka_pillar_mark            BOOLEAN,
    country_of_origin             TEXT,
    crackling_sound               BOOLEAN,
    currency_type                 TEXT,
    denomination                  TEXT,
    designation                   TEXT,
    fluorescence                  BOOLEAN,
    mahatma_mark                  BOOLEAN,
    number_of_pieces_of_currency  NUMERIC,
    other_visible                 TEXT,
    quality                       TEXT,
    quantity                      TEXT,
    remarks                       TEXT,
    security_thread               BOOLEAN,
    serial_number                 TEXT,
    series                        TEXT,
    water_mark                    BOOLEAN
);

CREATE TABLE property_details_automobiles (
    property_id               VARCHAR(24) PRIMARY KEY,
    chassis_no                TEXT,
    classification            TEXT,
    color                     TEXT,
    color_type                TEXT,
    district                  TEXT,
    driver_side               TEXT,
    engine_capacity           TEXT,
    engine_no                 TEXT,
    fuel                      TEXT,
    full_chasis_no            TEXT,
    full_engine_no            TEXT,
    insurance_certificate_no  TEXT,
    insurance_company_name    TEXT,
    license_class             TEXT,
    lifting_capacity          NUMERIC,
    location_type             TEXT,
    made                      TEXT,
    make                      TEXT,
    manufactured              TEXT,
    manufacturer              TEXT,
    mfg_month                 TEXT,
    mfg_year                  TEXT,
    model                     TEXT,
    mv_utility                TEXT,
    over_all_length           NUMERIC,
    owner_father_name         TEXT,
    owner_name                TEXT,
    permanent_address         TEXT,
    present_address           TEXT,
    registered_at             TEXT,
    registered_mobile_no      TEXT,
    registered_owner          TEXT,
    registration_date         TIMESTAMP,
    registration_no           TEXT,
    registration_number       TEXT,
    registration_place        TEXT,
    registration_valid_upto   TIMESTAMP,
    remarks                   TEXT,
    rta_name                  TEXT,
    rta_verification_date     TIMESTAMP,
    seat_capacity             NUMERIC,
    slogan_picture            TEXT,
    special_identifiaction    TEXT,
    sub_classification        TEXT,
    tmp_registration_no       TEXT,
    type                      TEXT,
    ulw                       NUMERIC,
    variant                   TEXT,
    wheel_base                NUMERIC
);

CREATE TABLE property_details_explosives (
    property_id             VARCHAR(24) PRIMARY KEY,
    chemicals               TEXT,
    destroyed               BOOLEAN,
    has_explosives_blasted  BOOLEAN,
    is_manufacturing_unit   BOOLEAN,
    particulars             TEXT,
    quantity                NUMERIC,
    send_to_fsl             BOOLEAN,
    source_of_explosives    TEXT
);

CREATE TABLE property_details_jewellery (
    property_id  VARCHAR(24) PRIMARY KEY,
    description  TEXT,
    quantity     NUMERIC,
    weight       NUMERIC
);

CREATE TABLE property_details_misc (
    property_id  VARCHAR(24) PRIMARY KEY,
    description  TEXT
);

CREATE TABLE property_details_documents (
    property_id           VARCHAR(24) PRIMARY KEY,
    document_no           TEXT,
    document_particulars  TEXT
);

CREATE TABLE property_details_electronics (
    property_id  VARCHAR(24) PRIMARY KEY,
    make         TEXT,
    model        TEXT,
    quantity     NUMERIC,
    remarks      TEXT
);

-- =============================================================================
-- 4. CHARGESHEET CLUSTER
-- =============================================================================

-- chargesheets : PK CHARGE_SHEET_ID. FK CRIME_ID. UPLOAD_CHARGE_SHEET.FILE_ID.
CREATE TABLE chargesheet (
    charge_sheet_id               VARCHAR(24) PRIMARY KEY,
    crime_id                      VARCHAR(24) NOT NULL,
    charge_sheet_date             TIMESTAMP,
    charge_sheet_no               TEXT,
    charge_sheet_no_for_icjs      TEXT,
    charge_sheet_type             TEXT,
    court_name                    TEXT,
    date_created                  TIMESTAMP,
    date_modified                 TIMESTAMP,
    is_ccl                        BOOLEAN,
    is_esigned                    BOOLEAN,
    upload_charge_sheet_file_id   VARCHAR(24)
);

-- chargesheet.ACCUSED_PARTICULARS[] : spec leaves item schema undefined -> JSONB
CREATE TABLE chargesheet_accused_particular (
    id               BIGSERIAL PRIMARY KEY,
    charge_sheet_id  VARCHAR(24) NOT NULL,
    data             JSONB
);

-- chargesheet.ACTS_AND_SECTIONS[] : spec leaves item schema undefined -> JSONB
CREATE TABLE chargesheet_act_section (
    id               BIGSERIAL PRIMARY KEY,
    charge_sheet_id  VARCHAR(24) NOT NULL,
    data             JSONB
);

-- update-chargesheets : PK UPDATE_CHARGE_SHEET_ID. FK CRIME_ID. Inlines TAKEN_ON_FILE.
CREATE TABLE update_chargesheet (
    update_charge_sheet_id    VARCHAR(24) PRIMARY KEY,
    crime_id                  VARCHAR(24) NOT NULL,
    charge_sheet_date         TIMESTAMP,
    charge_sheet_no           TEXT,
    charge_sheet_status       TEXT,
    date_created              TIMESTAMP,
    taken_on_file_case_type   TEXT,
    taken_on_file_court_case_no TEXT,
    taken_on_file_date        TIMESTAMP
);

-- =============================================================================
-- 5. INTERROGATION REPORT CLUSTER
-- =============================================================================

-- interrogation-reports/v1 : PK INTERROGATION_REPORT_ID. FK CRIME_ID, PERSON_ID.
-- Inlines all 1:1 objects (COMMISSION_OF_OFFENCE, PHYSICAL_FEATURES,
-- SOCIO_ECONOMIC_PROFILE, SHARE_OF_AMOUNT_SPENT, PRESENT_WHEREABOUTS/*).
CREATE TABLE interrogation_report (
    interrogation_report_id            VARCHAR(24) PRIMARY KEY,
    crime_id                           VARCHAR(24) NOT NULL,
    person_id                          VARCHAR(24),
    date_created                       TIMESTAMP,
    date_modified                      TIMESTAMP,
    other_indulgance_before_offence    TEXT,
    other_regular_habits               TEXT,
    time_since_modus_operandi          TEXT,
    -- COMMISSION_OF_OFFENCE
    commission_offence_time            TEXT,
    commission_other_offence_time      TEXT,
    -- PHYSICAL_FEATURES
    pf_beard                           TEXT,
    pf_build                           TEXT,
    pf_burn_marks                      TEXT,
    pf_color                           TEXT,
    pf_deformities                     TEXT,
    pf_deformities_or_peculiarities    TEXT,
    pf_ear                             TEXT,
    pf_eyes                            TEXT,
    pf_face                            TEXT,
    pf_hair                            TEXT,
    pf_height                          TEXT,
    pf_identification_marks            TEXT,
    pf_language_or_dialect             TEXT,
    pf_leucoderma                      TEXT,
    pf_mole                            TEXT,
    pf_mustache                        TEXT,
    pf_nose                            TEXT,
    pf_scar                            TEXT,
    pf_tattoo                          TEXT,
    pf_teeth                           TEXT,
    -- SOCIO_ECONOMIC_PROFILE
    socio_education                    TEXT,
    socio_income_group                 TEXT,
    socio_living_status                TEXT,
    socio_marital_status               TEXT,
    socio_occupation                   TEXT,
    -- SHARE_OF_AMOUNT_SPENT
    share_of_amount_spent              TEXT,
    other_share_of_amount_spent        TEXT,
    share_of_amount_spent_remarks      TEXT,
    -- PRESENT_WHEREABOUTS.ABSCONDING
    pw_absconding_crime_num            TEXT,
    pw_absconding_is_absconding        BOOLEAN,
    pw_absconding_wanted_in_ps         TEXT,
    -- PRESENT_WHEREABOUTS.DEAD
    pw_dead_death_details              TEXT,
    pw_dead_is_dead                    BOOLEAN,
    -- PRESENT_WHEREABOUTS.FACING_TRIAL
    pw_facing_trial_crime_num          TEXT,
    pw_facing_trial_is_facing_trial    BOOLEAN,
    pw_facing_trial_ps_name            TEXT,
    -- PRESENT_WHEREABOUTS.IN_JAIL
    pw_in_jail_crime_num               TEXT,
    pw_in_jail_dist_unit               TEXT,
    pw_in_jail_from_where_sent         TEXT,
    pw_in_jail_is_in_jail              BOOLEAN,
    -- PRESENT_WHEREABOUTS.NORMAL_LIFE
    pw_normal_life_eking_livelihood    TEXT,
    pw_normal_life_is_normal_life      BOOLEAN,
    -- PRESENT_WHEREABOUTS.ON_BAIL
    pw_on_bail_crime_num               TEXT,
    pw_on_bail_date_of_bail            TIMESTAMP,
    pw_on_bail_from_where_sent         TEXT,
    pw_on_bail_is_on_bail              BOOLEAN,
    -- PRESENT_WHEREABOUTS.REHABILITATED
    pw_rehabilitated_is_rehabilitated  BOOLEAN,
    pw_rehabilitated_details           TEXT
);

CREATE TABLE ir_associate_detail (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    gang                     TEXT,
    person_id                VARCHAR(24),
    relation                 TEXT
);

CREATE TABLE ir_consumer_detail (
    id                            BIGSERIAL PRIMARY KEY,
    interrogation_report_id       VARCHAR(24) NOT NULL,
    aadhar_card_number            TEXT,
    aadhar_card_number_phone_no   TEXT,
    consumer_person_id            VARCHAR(24),
    other_sources                 TEXT,
    other_sources_phone_no        TEXT,
    place_of_consumption          TEXT
);

CREATE TABLE ir_conviction_acquittal (
    id                              BIGSERIAL PRIMARY KEY,
    interrogation_report_id         VARCHAR(24) NOT NULL,
    crime_num                       TEXT,
    details_conviction_acquittal    TEXT,
    dist_unit                       TEXT,
    division                        TEXT,
    judgement_date                  TIMESTAMP,
    law_section                     TEXT,
    ps_code                         VARCHAR(64),
    reason                          TEXT,
    sc_cc_num                       TEXT
);

CREATE TABLE ir_defence_counsel (
    id                         BIGSERIAL PRIMARY KEY,
    interrogation_report_id    VARCHAR(24) NOT NULL,
    assistance                 TEXT,
    crime_num                  TEXT,
    defence_counsel_address    TEXT,
    defence_counsel_person_id  VARCHAR(24),
    defence_counsel_phone      TEXT,
    dist_division              TEXT,
    law_section                TEXT,
    ps_code                    VARCHAR(64),
    sc_cc_num                  TEXT
);

CREATE TABLE ir_execution_nbw (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    court                    TEXT,
    crime_num                TEXT,
    execution_date           TIMESTAMP,
    law_section              TEXT,
    ps_code                  VARCHAR(64),
    remarks                  TEXT,
    sc_cc_num                TEXT
);

CREATE TABLE ir_family_history (
    id                        BIGSERIAL PRIMARY KEY,
    interrogation_report_id   VARCHAR(24) NOT NULL,
    criminal_background       BOOLEAN,
    family_member_peculiarity TEXT,
    family_stay_together      BOOLEAN,
    is_alive                  BOOLEAN,
    person_id                 VARCHAR(24),
    relation                  TEXT
);

CREATE TABLE ir_financial_history (
    id                          BIGSERIAL PRIMARY KEY,
    interrogation_report_id     VARCHAR(24) NOT NULL,
    account_holder_person_id    VARCHAR(24),
    account_number              TEXT,
    branch_name                 TEXT,
    ifsc_code                   TEXT,
    immovable_property_acquired TEXT,
    movable_property_acquired   TEXT,
    name_of_bank                TEXT,
    pan_no                      TEXT,
    upi_id                      TEXT
);

CREATE TABLE ir_jail_sentence (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    acquaintance_address     TEXT,
    acquaintance_person_id   VARCHAR(24),
    crime_nature             TEXT,
    jail_name                TEXT,
    remanded_ps              TEXT,
    remarks                  TEXT,
    sentence_end_date        TIMESTAMP,
    sentence_start_date      TIMESTAMP
);

CREATE TABLE ir_local_contact (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    address                  TEXT,
    jurisdiction_ps          TEXT,
    person_id                VARCHAR(24),
    town                     TEXT
);

CREATE TABLE ir_modus_operandi (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    crime_head               TEXT,
    crime_sub_head           TEXT,
    modus_operandi           TEXT
);

CREATE TABLE ir_new_gang_formation (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    address                  TEXT,
    history_ps               TEXT,
    history_state            TEXT,
    history_unit             TEXT,
    is_add_or_split          BOOLEAN,
    lodged_jails             TEXT,
    name                     TEXT
);

CREATE TABLE ir_pending_nbw (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    court                    TEXT,
    crime_num                TEXT,
    dist_division            TEXT,
    law_section              TEXT,
    pending_since            TIMESTAMP,
    ps_code                  VARCHAR(64),
    sc_cc_num                TEXT,
    sureties                 TEXT
);

CREATE TABLE ir_previous_offence_confessed (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    arrested_by              TEXT,
    arrest_date              TIMESTAMP,
    arrest_place             TEXT,
    crime_num                TEXT,
    dist_unit_division       TEXT,
    gang_member              TEXT,
    interrogated_by          TEXT,
    law_section              TEXT,
    others_identify          TEXT,
    property_recovered       TEXT,
    property_stolen          TEXT,
    ps_code                  VARCHAR(64),
    remarks                  TEXT
);

CREATE TABLE ir_property_disposal (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    address                  TEXT,
    disposed_by              TEXT,
    disposed_person          TEXT,
    disposed_type            TEXT,
    person_id                VARCHAR(24),
    receiver_person_id       VARCHAR(24)
);

CREATE TABLE ir_regularization_transit_warrant (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    court                    TEXT,
    crime_num                TEXT,
    dist_division            TEXT,
    law_section              TEXT,
    ps_code                  VARCHAR(64),
    regularization_date      TIMESTAMP,
    remarks                  TEXT,
    sc_cc_num                TEXT
);

CREATE TABLE ir_shelter (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    after_offence            TEXT,
    other_regular_residency  TEXT,
    preparation_of_offence   TEXT,
    regular_residency        TEXT,
    remarks                  TEXT
);

CREATE TABLE ir_sim_detail (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    imei                     TEXT,
    person_id                VARCHAR(24),
    phone_number             TEXT,
    sdr                      TEXT,
    true_caller_name         TEXT
);

CREATE TABLE ir_surety (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    crime_num                TEXT,
    dist_division            TEXT,
    law_section              TEXT,
    ps_code                  VARCHAR(64),
    residency_type           TEXT,
    sc_cc_num                TEXT,
    surety_address           TEXT,
    surety_nature            TEXT,
    surety_person_id         VARCHAR(24)
);

CREATE TABLE ir_type_of_drug (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    mode_of_payment          TEXT,
    mode_of_transport        TEXT,
    purchase_amount_in_inr    TEXT,
    quantity                 TEXT,
    receivers_person_id      VARCHAR(24),
    supplier_person_id       VARCHAR(24),
    type_of_drug             TEXT
);

-- Simple string-array children
CREATE TABLE ir_indulgance_before_offence (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    value                    TEXT
);

CREATE TABLE ir_interrogation_text (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    value                    TEXT
);

CREATE TABLE ir_media (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    value                    TEXT
);

CREATE TABLE ir_regular_habit (
    id                       BIGSERIAL PRIMARY KEY,
    interrogation_report_id  VARCHAR(24) NOT NULL,
    value                    TEXT
);

-- =============================================================================
-- 6. FINGERPRINT BUREAU (FPB)
-- =============================================================================

-- fpb/accused, fpb/accused/pcn : no spec PK -> surrogate. FK CRIME_ID, PERSON_ID.
CREATE TABLE fpb_accused (
    fpb_accused_id                 BIGSERIAL PRIMARY KEY,
    crime_id                       VARCHAR(24),
    person_id                      VARCHAR(24),
    age                            TEXT,
    alias                          TEXT,
    caste                          TEXT,
    cc_kd_dc_no                    TEXT,
    confession_statement           TEXT,
    date_fingerprinted             TIMESTAMP,
    date_of_arrest                 TIMESTAMP,
    dob                            DATE,
    father_husband_name            TEXT,
    fir_reg_num                    TEXT,
    fp_unit                        TEXT,
    full_name                      TEXT,
    mo                             TEXT,
    nationality                    TEXT,
    occupation                     TEXT,
    phone_number                   TEXT,
    place_of_birth                 TEXT,
    property_recovered             TEXT,
    ps_where_fps_obtained          TEXT,
    religion                       TEXT,
    remarks                        TEXT,
    sex                            TEXT,
    slip_type                      TEXT,
    surname                        TEXT,
    -- AADHAAR_OR_OTHER_ID
    aadhaar_or_other_id_number     TEXT,
    aadhaar_or_other_id_type       TEXT,
    -- ARREST_DETAILS
    arrest_details_crime_no        TEXT,
    arrest_details_crime_year      TEXT,
    arrest_details_district        TEXT,
    arrest_details_ps_name         TEXT,
    arrest_details_section_of_law  TEXT,
    arrest_details_state_of_arrest TEXT,
    -- PERMANENT_ADDRESS
    permanent_address_address      TEXT,
    permanent_address_district     TEXT,
    permanent_address_state_ut     TEXT,
    -- PRESENT_ADDRESS
    present_address_address        TEXT,
    present_address_district       TEXT,
    present_address_state_ut       TEXT,
    -- PHYSICAL_FEATURES
    pf_beard                       TEXT,
    pf_chin                        TEXT,
    pf_complexion_of_face          TEXT,
    pf_ear                         TEXT,
    pf_eyebrows                    TEXT,
    pf_forehead                    TEXT,
    pf_hair                        TEXT,
    pf_hair_color                  TEXT,
    pf_height                      TEXT,
    pf_jaws                        TEXT,
    pf_lips                        TEXT,
    pf_moustaches                  TEXT,
    pf_mouth                       TEXT,
    pf_neck                        TEXT,
    pf_nose                        TEXT,
    pf_shape_of_face               TEXT,
    pf_weight                      TEXT
);

-- fpb_accused.ADDITIONAL_CRIMES[] (1:M)
CREATE TABLE fpb_additional_crime (
    id              BIGSERIAL PRIMARY KEY,
    fpb_accused_id  BIGINT NOT NULL,
    crime_no        TEXT,
    district        TEXT,
    police_station  TEXT,
    section_of_law  TEXT,
    state           TEXT,
    year            TEXT
);

-- =============================================================================
-- 7. REPORTS
-- =============================================================================

-- reports/stolen-automobiles : PK STOLEN_PROPERTY_ID. FK CRIME_ID.
CREATE TABLE stolen_automobile (
    stolen_property_id        VARCHAR(24) PRIMARY KEY,
    crime_id                  VARCHAR(24),
    auto_seq_no               TEXT,
    auto_type                 TEXT,
    belongs_to_whom           TEXT,
    chassis_no                TEXT,
    classification            TEXT,
    color                     TEXT,
    color_type                TEXT,
    date_created              TIMESTAMP,
    date_modified             TIMESTAMP,
    date_of_seizure           TIMESTAMP,
    district                  TEXT,
    driver_side               TEXT,
    engine_capacity           TEXT,
    engine_no                 TEXT,
    estimate_value            NUMERIC,
    fuel                      TEXT,
    full_chassis_no           TEXT,
    full_engine_no            TEXT,
    insurance_certificate_no  TEXT,
    insurance_company_name    TEXT,
    license_class             TEXT,
    lifting_capacity          NUMERIC,
    location_type             TEXT,
    made                      TEXT,
    make                      TEXT,
    manufactured              TEXT,
    manufacturer              TEXT,
    mfg_month                 TEXT,
    mfg_year                  TEXT,
    model                     TEXT,
    mv_utility                TEXT,
    nature_of_stolen          TEXT,
    over_all_length           NUMERIC,
    owner_father_name         TEXT,
    owner_name                TEXT,
    particular_of_property    TEXT,
    permanent_address         TEXT,
    place_of_recovery         TEXT,
    present_address           TEXT,
    property_category         TEXT,
    property_category_name    TEXT,
    property_recovered_from   TEXT,
    property_status           TEXT,
    recovered_value           NUMERIC,
    registered_at             TEXT,
    registered_mobile_no      TEXT,
    registered_owner          TEXT,
    registration_date         TIMESTAMP,
    registration_no           TEXT,
    registration_number       TEXT,
    registration_place        TEXT,
    registration_valid_upto   TIMESTAMP,
    remarks                   TEXT,
    rta_name                  TEXT,
    rta_verification_date     TIMESTAMP,
    seat_capacity             NUMERIC,
    seq_no                    TEXT,
    slogan_picture            TEXT,
    special_identification    TEXT,
    sub_classification        TEXT,
    tmp_registration_no       TEXT,
    total_estimated_value     NUMERIC,
    ulw                       NUMERIC,
    variant                   TEXT,
    wheel_base                NUMERIC
);

-- reports/stolen-automobiles MEDIA[] (1:M, array of string references)
CREATE TABLE stolen_automobile_media (
    id                  BIGSERIAL PRIMARY KEY,
    stolen_property_id  VARCHAR(24) NOT NULL,
    media_ref           TEXT
);

-- =============================================================================
-- 8. FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- person children
ALTER TABLE person_identity_detail
    ADD CONSTRAINT fk_pid_person FOREIGN KEY (person_id) REFERENCES person(person_id),
    ADD CONSTRAINT fk_pid_file   FOREIGN KEY (file_id)   REFERENCES file(file_id);
ALTER TABLE person_media
    ADD CONSTRAINT fk_pmedia_person FOREIGN KEY (person_id) REFERENCES person(person_id);

-- crime cluster
ALTER TABLE crime
    ADD CONSTRAINT fk_crime_ps          FOREIGN KEY (ps_code)        REFERENCES police_station(ps_code),
    ADD CONSTRAINT fk_crime_complainant FOREIGN KEY (complainant_id) REFERENCES person(person_id);
ALTER TABLE crime_disposal
    ADD CONSTRAINT fk_disposal_crime FOREIGN KEY (crime_id) REFERENCES crime(crime_id);
ALTER TABLE accused
    ADD CONSTRAINT fk_accused_crime  FOREIGN KEY (crime_id)  REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_accused_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE arrest
    ADD CONSTRAINT fk_arrest_crime  FOREIGN KEY (crime_id)  REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_arrest_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE mo_seizure
    ADD CONSTRAINT fk_moseizure_crime FOREIGN KEY (crime_id) REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_moseizure_file  FOREIGN KEY (mo_media_file_id) REFERENCES file(file_id);

-- property cluster
ALTER TABLE case_property
    ADD CONSTRAINT fk_cp_crime FOREIGN KEY (crime_id) REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_cp_mo    FOREIGN KEY (mo_id)    REFERENCES mo_seizure(mo_seizure_id);
ALTER TABLE case_property_media
    ADD CONSTRAINT fk_cpmedia_cp   FOREIGN KEY (case_property_id) REFERENCES case_property(case_property_id),
    ADD CONSTRAINT fk_cpmedia_file FOREIGN KEY (file_id)          REFERENCES file(file_id);
ALTER TABLE property
    ADD CONSTRAINT fk_property_crime FOREIGN KEY (crime_id)         REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_property_cp    FOREIGN KEY (case_property_id) REFERENCES case_property(case_property_id);
ALTER TABLE property_media
    ADD CONSTRAINT fk_pmedia_property FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_drugs
    ADD CONSTRAINT fk_pd_drugs FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_cultural
    ADD CONSTRAINT fk_pd_cultural FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_arms
    ADD CONSTRAINT fk_pd_arms FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_coins_currency
    ADD CONSTRAINT fk_pd_coins FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_automobiles
    ADD CONSTRAINT fk_pd_auto FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_explosives
    ADD CONSTRAINT fk_pd_explosives FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_jewellery
    ADD CONSTRAINT fk_pd_jewellery FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_misc
    ADD CONSTRAINT fk_pd_misc FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_documents
    ADD CONSTRAINT fk_pd_documents FOREIGN KEY (property_id) REFERENCES property(property_id);
ALTER TABLE property_details_electronics
    ADD CONSTRAINT fk_pd_electronics FOREIGN KEY (property_id) REFERENCES property(property_id);

-- chargesheet cluster
ALTER TABLE chargesheet
    ADD CONSTRAINT fk_cs_crime FOREIGN KEY (crime_id)                    REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_cs_file  FOREIGN KEY (upload_charge_sheet_file_id) REFERENCES file(file_id);
ALTER TABLE chargesheet_accused_particular
    ADD CONSTRAINT fk_csap_cs FOREIGN KEY (charge_sheet_id) REFERENCES chargesheet(charge_sheet_id);
ALTER TABLE chargesheet_act_section
    ADD CONSTRAINT fk_csas_cs FOREIGN KEY (charge_sheet_id) REFERENCES chargesheet(charge_sheet_id);
ALTER TABLE update_chargesheet
    ADD CONSTRAINT fk_ucs_crime FOREIGN KEY (crime_id) REFERENCES crime(crime_id);

-- interrogation report cluster
ALTER TABLE interrogation_report
    ADD CONSTRAINT fk_ir_crime  FOREIGN KEY (crime_id)  REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_ir_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE ir_associate_detail
    ADD CONSTRAINT fk_irad_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irad_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE ir_consumer_detail
    ADD CONSTRAINT fk_ircd_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_ircd_person FOREIGN KEY (consumer_person_id) REFERENCES person(person_id);
ALTER TABLE ir_conviction_acquittal
    ADD CONSTRAINT fk_irca_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_defence_counsel
    ADD CONSTRAINT fk_irdc_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irdc_person FOREIGN KEY (defence_counsel_person_id) REFERENCES person(person_id);
ALTER TABLE ir_execution_nbw
    ADD CONSTRAINT fk_irenbw_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_family_history
    ADD CONSTRAINT fk_irfh_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irfh_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE ir_financial_history
    ADD CONSTRAINT fk_irfin_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irfin_person FOREIGN KEY (account_holder_person_id) REFERENCES person(person_id);
ALTER TABLE ir_jail_sentence
    ADD CONSTRAINT fk_irjs_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irjs_person FOREIGN KEY (acquaintance_person_id) REFERENCES person(person_id);
ALTER TABLE ir_local_contact
    ADD CONSTRAINT fk_irlc_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irlc_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE ir_modus_operandi
    ADD CONSTRAINT fk_irmo_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_new_gang_formation
    ADD CONSTRAINT fk_irngf_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_pending_nbw
    ADD CONSTRAINT fk_irpnbw_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_previous_offence_confessed
    ADD CONSTRAINT fk_irpoc_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_property_disposal
    ADD CONSTRAINT fk_irpd_ir       FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irpd_person   FOREIGN KEY (person_id)          REFERENCES person(person_id),
    ADD CONSTRAINT fk_irpd_receiver FOREIGN KEY (receiver_person_id) REFERENCES person(person_id);
ALTER TABLE ir_regularization_transit_warrant
    ADD CONSTRAINT fk_irrtw_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_shelter
    ADD CONSTRAINT fk_irsh_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_sim_detail
    ADD CONSTRAINT fk_irsim_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irsim_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE ir_surety
    ADD CONSTRAINT fk_irsu_ir     FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irsu_person FOREIGN KEY (surety_person_id) REFERENCES person(person_id);
ALTER TABLE ir_type_of_drug
    ADD CONSTRAINT fk_irtod_ir       FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id),
    ADD CONSTRAINT fk_irtod_receiver FOREIGN KEY (receivers_person_id) REFERENCES person(person_id),
    ADD CONSTRAINT fk_irtod_supplier FOREIGN KEY (supplier_person_id) REFERENCES person(person_id);
ALTER TABLE ir_indulgance_before_offence
    ADD CONSTRAINT fk_iribo_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_interrogation_text
    ADD CONSTRAINT fk_irit_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_media
    ADD CONSTRAINT fk_irm_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);
ALTER TABLE ir_regular_habit
    ADD CONSTRAINT fk_irrh_ir FOREIGN KEY (interrogation_report_id) REFERENCES interrogation_report(interrogation_report_id);

-- FPB
ALTER TABLE fpb_accused
    ADD CONSTRAINT fk_fpb_crime  FOREIGN KEY (crime_id)  REFERENCES crime(crime_id),
    ADD CONSTRAINT fk_fpb_person FOREIGN KEY (person_id) REFERENCES person(person_id);
ALTER TABLE fpb_additional_crime
    ADD CONSTRAINT fk_fpbac_fpb FOREIGN KEY (fpb_accused_id) REFERENCES fpb_accused(fpb_accused_id);

-- reports
ALTER TABLE stolen_automobile
    ADD CONSTRAINT fk_stolen_crime FOREIGN KEY (crime_id) REFERENCES crime(crime_id);
ALTER TABLE stolen_automobile_media
    ADD CONSTRAINT fk_stolenmedia_auto FOREIGN KEY (stolen_property_id) REFERENCES stolen_automobile(stolen_property_id);

-- =============================================================================
-- 9. FOREIGN KEY INDEXES
-- =============================================================================

CREATE INDEX idx_pid_person             ON person_identity_detail(person_id);
CREATE INDEX idx_pid_file               ON person_identity_detail(file_id);
CREATE INDEX idx_pmedia_person          ON person_media(person_id);
CREATE INDEX idx_crime_ps               ON crime(ps_code);
CREATE INDEX idx_crime_complainant      ON crime(complainant_id);
CREATE INDEX idx_accused_crime          ON accused(crime_id);
CREATE INDEX idx_accused_person         ON accused(person_id);
CREATE INDEX idx_arrest_crime           ON arrest(crime_id);
CREATE INDEX idx_arrest_person          ON arrest(person_id);
CREATE INDEX idx_moseizure_crime        ON mo_seizure(crime_id);
CREATE INDEX idx_moseizure_file         ON mo_seizure(mo_media_file_id);
CREATE INDEX idx_cp_crime               ON case_property(crime_id);
CREATE INDEX idx_cp_mo                  ON case_property(mo_id);
CREATE INDEX idx_cpmedia_cp             ON case_property_media(case_property_id);
CREATE INDEX idx_cpmedia_file           ON case_property_media(file_id);
CREATE INDEX idx_property_crime         ON property(crime_id);
CREATE INDEX idx_property_cp            ON property(case_property_id);
CREATE INDEX idx_pmedia_property        ON property_media(property_id);
CREATE INDEX idx_cs_crime               ON chargesheet(crime_id);
CREATE INDEX idx_cs_file                ON chargesheet(upload_charge_sheet_file_id);
CREATE INDEX idx_csap_cs                ON chargesheet_accused_particular(charge_sheet_id);
CREATE INDEX idx_csas_cs                ON chargesheet_act_section(charge_sheet_id);
CREATE INDEX idx_ucs_crime              ON update_chargesheet(crime_id);
CREATE INDEX idx_ir_crime               ON interrogation_report(crime_id);
CREATE INDEX idx_ir_person              ON interrogation_report(person_id);
CREATE INDEX idx_irad_ir                ON ir_associate_detail(interrogation_report_id);
CREATE INDEX idx_ircd_ir                ON ir_consumer_detail(interrogation_report_id);
CREATE INDEX idx_irca_ir                ON ir_conviction_acquittal(interrogation_report_id);
CREATE INDEX idx_irdc_ir                ON ir_defence_counsel(interrogation_report_id);
CREATE INDEX idx_irenbw_ir              ON ir_execution_nbw(interrogation_report_id);
CREATE INDEX idx_irfh_ir                ON ir_family_history(interrogation_report_id);
CREATE INDEX idx_irfin_ir               ON ir_financial_history(interrogation_report_id);
CREATE INDEX idx_irjs_ir                ON ir_jail_sentence(interrogation_report_id);
CREATE INDEX idx_irlc_ir                ON ir_local_contact(interrogation_report_id);
CREATE INDEX idx_irmo_ir                ON ir_modus_operandi(interrogation_report_id);
CREATE INDEX idx_irngf_ir               ON ir_new_gang_formation(interrogation_report_id);
CREATE INDEX idx_irpnbw_ir              ON ir_pending_nbw(interrogation_report_id);
CREATE INDEX idx_irpoc_ir               ON ir_previous_offence_confessed(interrogation_report_id);
CREATE INDEX idx_irpd_ir                ON ir_property_disposal(interrogation_report_id);
CREATE INDEX idx_irrtw_ir               ON ir_regularization_transit_warrant(interrogation_report_id);
CREATE INDEX idx_irsh_ir                ON ir_shelter(interrogation_report_id);
CREATE INDEX idx_irsim_ir               ON ir_sim_detail(interrogation_report_id);
CREATE INDEX idx_irsu_ir                ON ir_surety(interrogation_report_id);
CREATE INDEX idx_irtod_ir               ON ir_type_of_drug(interrogation_report_id);
CREATE INDEX idx_iribo_ir               ON ir_indulgance_before_offence(interrogation_report_id);
CREATE INDEX idx_irit_ir                ON ir_interrogation_text(interrogation_report_id);
CREATE INDEX idx_irm_ir                 ON ir_media(interrogation_report_id);
CREATE INDEX idx_irrh_ir                ON ir_regular_habit(interrogation_report_id);
CREATE INDEX idx_fpb_crime              ON fpb_accused(crime_id);
CREATE INDEX idx_fpb_person             ON fpb_accused(person_id);
CREATE INDEX idx_fpbac_fpb              ON fpb_additional_crime(fpb_accused_id);
CREATE INDEX idx_stolen_crime           ON stolen_automobile(crime_id);
CREATE INDEX idx_stolenmedia_auto       ON stolen_automobile_media(stolen_property_id);

-- =============================================================================
-- 10. REPORT VIEWS
-- =============================================================================
-- These endpoints return read-only aggregations. The relay flattens data from
-- the source; the joins below are best-effort reconstructions over base tables.

-- reports/arrest/arrest-particulars/v1
CREATE VIEW v_arrest_particulars AS
SELECT
    a.crime_id                       AS crime_id,
    p.age                            AS accused_age,
    p.full_name                      AS accused_name,
    c.acts_sections                  AS acts_sections,
    a.accused_type                   AS arrest_type,
    c.brief_facts                    AS brief_facts,
    a.arrested_date                  AS date_of_arrest,
    c.poo_district                   AS district,
    c.fir_date                       AS fir_date,
    c.fir_num                        AS fir_num,
    p.gender                         AS gender,
    c.io_name                        AS io_name,
    c.io_rank                        AS io_rank,
    p.pa_house_no                    AS present_house_no,
    p.pa_area_mandal                 AS present_area_mandal,
    p.pa_district                    AS present_district,
    p.pa_state_ut                    AS present_state_ut,
    p.pa_pin_code                    AS present_pin_code,
    ps.ps_name                       AS ps_name
FROM arrest a
JOIN crime c            ON c.crime_id = a.crime_id
LEFT JOIN person p      ON p.person_id = a.person_id
LEFT JOIN police_station ps ON ps.ps_code = c.ps_code;

-- reports/missing-udb-persons/v1  (best-effort: links crime to its complainant)
CREATE VIEW v_missing_udb_persons AS
SELECT
    c.crime_id                       AS crime_id,
    c.acts_sections                  AS acts_sections,
    c.brief_facts                    AS brief_facts,
    c.fir_num                        AS fir_num,
    c.io_name                        AS io_name,
    c.io_rank                        AS io_rank,
    c.poo_district                   AS district,
    p.full_name                      AS person_name,
    p.gender                         AS gender,
    p.age                            AS person_age,
    p.pa_house_no                    AS present_house_no,
    p.pa_area_mandal                 AS present_area_mandal,
    p.pa_district                    AS present_district,
    p.pa_state_ut                    AS present_state_ut,
    p.pa_pin_code                    AS present_pin_code,
    ps.ps_name                       AS ps_name
FROM crime c
LEFT JOIN person p          ON p.person_id = c.complainant_id
LEFT JOIN police_station ps ON ps.ps_code = c.ps_code;

COMMIT;
