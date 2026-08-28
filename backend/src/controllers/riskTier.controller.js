import prisma from '../config/db.js';

const WRITE_ROLES = ['STATE_ADMIN', 'police', 'DISTRICT_USER'];

export { WRITE_ROLES };

const normalizeCode = (code) => (code || '').trim().toUpperCase();

async function getValidTierCodes() {
  const rows = await prisma.riskTierDefinition.findMany({ select: { code: true } });
  return rows.map((r) => r.code);
}

const parseSection = async (body) => {
  const act_name = (body.act_name || '').trim();
  const section_code = (body.section_code || '').trim();
  const tier = normalizeCode(body.tier);
  const severity_rank = Number.parseInt(body.severity_rank, 10);
  const description = (body.description || '').trim() || null;

  if (!act_name || !section_code || !tier || Number.isNaN(severity_rank)) {
    return { error: 'Act name, section code, tier, and severity rank are required.' };
  }

  const validTiers = await getValidTierCodes();
  if (!validTiers.includes(tier)) {
    return { error: `Tier must match an existing risk tier (${validTiers.join(', ') || 'none defined'}).` };
  }
  if (severity_rank < 0 || severity_rank > 100) {
    return { error: 'Severity rank must be between 0 and 100.' };
  }

  return { act_name, section_code, tier, severity_rank, description };
};

const parseDefinition = (body) => {
  const code = normalizeCode(body.code);
  const name = (body.name || '').trim();
  const category = (body.category || '').trim();
  const description = (body.description || '').trim();
  const nature = (body.nature || '').trim();
  const retention = (body.retention || '').trim();
  const colorClass = (body.colorClass || 'bg-slate-600').trim();
  const defaultRank = Number.parseInt(body.defaultRank, 10);
  const sortOrder = Number.parseInt(body.sortOrder ?? 0, 10);

  if (!code || !name || !category || !description || !nature || !retention) {
    return { error: 'Code, name, category, description, nature, and retention are required.' };
  }
  if (Number.isNaN(defaultRank) || defaultRank < 0 || defaultRank > 100) {
    return { error: 'Default rank must be between 0 and 100.' };
  }
  if (Number.isNaN(sortOrder)) {
    return { error: 'Sort order must be a number.' };
  }

  return { code, name, category, description, nature, retention, colorClass, defaultRank, sortOrder };
};

export const listDefinitions = async (req, res) => {
  try {
    const rows = await prisma.riskTierDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load risk tier definitions.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const createDefinition = async (req, res) => {
  try {
    const parsed = parseDefinition(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const row = await prisma.riskTierDefinition.create({ data: parsed });
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A tier with this code already exists.' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create risk tier.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateDefinition = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid tier id.' });
    }

    const existing = await prisma.riskTierDefinition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tier not found.' });
    }

    const parsed = parseDefinition(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const row = await prisma.$transaction(async (tx) => {
      if (parsed.code !== existing.code) {
        await tx.ssor_kb.updateMany({
          where: { tier: existing.code },
          data: { tier: parsed.code },
        });
      }
      return tx.riskTierDefinition.update({ where: { id }, data: parsed });
    });

    res.status(200).json({ success: true, data: row });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A tier with this code already exists.' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update risk tier.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const deleteDefinition = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid tier id.' });
    }

    const existing = await prisma.riskTierDefinition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tier not found.' });
    }

    const sectionCount = await prisma.ssor_kb.count({ where: { tier: existing.code } });
    if (sectionCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete tier with ${sectionCount} section mapping(s). Remove sections first.`,
      });
    }

    await prisma.riskTierDefinition.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Tier deleted.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete risk tier.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const listSections = async (req, res) => {
  try {
    const rows = await prisma.ssor_kb.findMany({
      orderBy: [{ tier: 'asc' }, { severity_rank: 'desc' }, { act_name: 'asc' }, { section_code: 'asc' }],
    });
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load section mappings.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const createSection = async (req, res) => {
  try {
    const parsed = await parseSection(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const row = await prisma.ssor_kb.create({ data: parsed });
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'This act and section combination already exists.' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create section mapping.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid entry id.' });
    }

    const parsed = await parseSection(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const row = await prisma.ssor_kb.update({ where: { id }, data: parsed });
    res.status(200).json({ success: true, data: row });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'This act and section combination already exists.' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update section mapping.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid entry id.' });
    }

    await prisma.ssor_kb.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Entry deleted.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete section mapping.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Backwards-compatible exports
export const listRiskTiers = listSections;
export const createRiskTier = createSection;
export const updateRiskTier = updateSection;
export const deleteRiskTier = deleteSection;
