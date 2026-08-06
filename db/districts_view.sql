-- =============================================================================
-- MATERIALIZED VIEW FOR DISTRICTS
-- =============================================================================

-- Drop the materialized view if it already exists
DROP MATERIALIZED VIEW IF EXISTS public.mv_districts CASCADE;

-- Create the materialized view to fetch unique district codes and names
CREATE MATERIALIZED VIEW public.mv_districts AS
SELECT DISTINCT
    dist_code,
    dist_name
FROM cctns_etl.hierarchy
WHERE dist_code IS NOT NULL
ORDER BY dist_name;

-- Create a unique index on the district code to allow for concurrent refreshes
-- and to optimize search performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_districts_code ON public.mv_districts (dist_code);

-- =============================================================================
-- REFRESH COMMAND
-- =============================================================================
-- Use this command to refresh the data in the materialized view.
-- The CONCURRENTLY keyword allows reads to continue while the view is updating,
-- which requires the unique index created above.
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_districts;
