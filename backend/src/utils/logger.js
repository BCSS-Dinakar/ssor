/**
 * Minimal structured logger — no external dependency.
 *
 * - JSON lines in production (parseable by log collectors), pretty text in dev.
 * - Levels gated by LOG_LEVEL (error < warn < info < debug); default info.
 * - Basic secret redaction on logged metadata.
 *
 * Usage: logger.info('message', { key: value })  /  logger.error('label', err)
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
const isProd = process.env.NODE_ENV === 'production';

const REDACT = /(password|passwordhash|secret|token|authorization|accesskey|secretkey|cookie|jwt)/i;

const redact = (value) => {
  if (!value || typeof value !== 'object') return value;
  const out = Array.isArray(value) ? [] : {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACT.test(k) ? '[redacted]' : (v && typeof v === 'object' ? redact(v) : v);
  }
  return out;
};

// Errors don't serialise via JSON.stringify by default — pull the useful bits.
const normalizeMeta = (meta) => {
  if (meta instanceof Error) return { error: meta.message, stack: isProd ? undefined : meta.stack };
  return redact(meta);
};

const emit = (level, message, meta) => {
  if (LEVELS[level] > currentLevel) return;
  const time = new Date().toISOString();
  const payload = meta === undefined ? undefined : normalizeMeta(meta);
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (isProd) {
    sink(JSON.stringify({ time, level, message, ...(payload && typeof payload === 'object' ? payload : { meta: payload }) }));
  } else {
    sink(`${time} ${level.toUpperCase().padEnd(5)} ${message}`, payload !== undefined ? payload : '');
  }
};

export const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
};

export default logger;
