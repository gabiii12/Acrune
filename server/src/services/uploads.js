// Payment screenshots: stored privately in server/uploads, only admins can view them.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.js';

const DIR = config.paths.uploads;
const MAX_BYTES = 3 * 1024 * 1024;
const SAFE_NAME = /^[\w-]+\.(jpg|png|webp)$/;

fs.mkdirSync(DIR, { recursive: true });

// Accept only real images, checked by their first bytes (not by what the browser claims).
function imageExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

// Turn a "data:image/...;base64,..." string into a checked image buffer.
// Returns { buf, ext } or { error } with a customer-friendly message.
export function parseScreenshot(dataUrl) {
  const m = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
  if (!m) return { error: 'Attach a screenshot of your GCash receipt' };
  const buf = Buffer.from(m[1], 'base64');
  const ext = imageExt(buf);
  if (!ext) return { error: 'The screenshot must be a JPG, PNG or WebP image' };
  if (buf.length > MAX_BYTES) return { error: 'Screenshot is too large (max 3 MB)' };
  return { buf, ext };
}

// Save under a random name; returns the stored filename.
export function saveScreenshot(orderId, { buf, ext }) {
  const file = `${orderId}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(DIR + file, buf);
  return file;
}

// Full path for a stored file, or null if the name is missing/unsafe/not on disk.
export function screenshotPath(file) {
  if (!file || !SAFE_NAME.test(file)) return null;
  const full = DIR + file;
  return fs.existsSync(full) ? full : null;
}

export function deleteScreenshot(file) {
  if (file && SAFE_NAME.test(file)) fs.rmSync(DIR + file, { force: true });
}
