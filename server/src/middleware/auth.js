// Admin login tokens: signed (no server memory needed), survive restarts, expire after 7 days,
// and stop working when ADMIN_PASSWORD changes.
import crypto from 'node:crypto';
import { config } from '../config.js';

const SESSION_MS = 7 * 24 * 3600_000;

const secret = () => crypto.createHash('sha256')
  .update(`admin:${config.adminSecret}:${config.adminPassword}`).digest();
const sign = (exp) => crypto.createHmac('sha256', secret()).update(String(exp)).digest('hex');

export function issueToken() {
  const exp = Date.now() + SESSION_MS;
  return `${exp}.${sign(exp)}`;
}

function isValid(token) {
  const [exp, sig] = String(token || '').split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Constant-time password check. Returns 'ok', 'wrong' or 'not_configured'.
export function checkPassword(input) {
  const pw = config.adminPassword;
  if (pw.length < 8 || /^(change|your|placeholder)/i.test(pw)) return 'not_configured';
  const a = Buffer.from(String(input ?? '')), b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? 'ok' : 'wrong';
}

export const requireAdmin = (req, res, next) =>
  isValid(req.get('x-admin-token')) ? next() : res.status(401).json({ error: 'Unauthorized' });
