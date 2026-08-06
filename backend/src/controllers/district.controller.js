import prisma from '../config/db.js';

export const getDistricts = async (req, res) => {
  try {
    let districts = [];

    // Strategy 1: Try mv_districts (if it has been created)
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT dist_code AS "distCode", dist_name AS "distName"
         FROM public.mv_districts
         WHERE dist_code IS NOT NULL AND dist_code != '' AND dist_name IS NOT NULL AND dist_name != ''
         ORDER BY dist_name ASC`
      );
      if (rows && rows.length > 0) districts = rows;
    } catch (_) { /* mv_districts not yet created */ }

    // Strategy 2: Query cctns_etl.hierarchy foreign table directly via FDW
    if (districts.length === 0) {
      try {
        const rows = await prisma.$queryRawUnsafe(
          `SELECT DISTINCT dist_code AS "distCode", dist_name AS "distName"
           FROM cctns_etl.hierarchy
           WHERE dist_code IS NOT NULL AND dist_code != ''
             AND dist_name IS NOT NULL AND dist_name != ''
           ORDER BY dist_name ASC`
        );
        if (rows && rows.length > 0) {
          districts = rows;
          // Auto-sync into local District table so FK constraints work
          for (const row of rows) {
            await prisma.district.upsert({
              where: { distCode: row.distCode },
              update: { distName: row.distName },
              create: { distCode: row.distCode, distName: row.distName }
            });
          }
        }
      } catch (_) { /* FDW not available */ }
    }

    // Strategy 3: Fall back to local District table
    if (districts.length === 0) {
      districts = await prisma.district.findMany({ orderBy: { distName: 'asc' } });
    }

    res.status(200).json({ success: true, data: districts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const syncDistricts = async (req, res) => {
  try {
    let rows = [];

    // Try mv_districts first, fall back to hierarchy
    try {
      rows = await prisma.$queryRawUnsafe(
        `SELECT dist_code AS "distCode", dist_name AS "distName"
         FROM public.mv_districts
         WHERE dist_code IS NOT NULL AND dist_code != ''`
      );
    } catch (_) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT dist_code AS "distCode", dist_name AS "distName"
         FROM cctns_etl.hierarchy
         WHERE dist_code IS NOT NULL AND dist_code != ''
           AND dist_name IS NOT NULL AND dist_name != ''`
      );
    }

    let added = 0;
    for (const row of rows) {
      await prisma.district.upsert({
        where: { distCode: row.distCode },
        update: { distName: row.distName },
        create: { distCode: row.distCode, distName: row.distName }
      });
      added++;
    }

    res.status(200).json({ success: true, message: `Synced ${added} districts.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
