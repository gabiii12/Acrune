// The combined service list from every provider: fetching, caching, cleaning and the
// customer-facing shape. `rate` is the customer price in PHP per 1000; `cost` is ours.
import { providers, phpFactor } from '../providers.js';
import { round } from '../utils.js';

const CACHE_MS = 5 * 60_000;
let cache = { at: 0, list: [] };
let inflight = null;

export function getServices() {
  if (Date.now() - cache.at < CACHE_MS && cache.list.length) return Promise.resolve(cache.list);
  // One refresh at a time; if every provider is down, keep serving the last good list.
  inflight ??= fetchServices()
    .catch((e) => { if (cache.list.length) return cache.list; throw e; })
    .finally(() => { inflight = null; });
  return inflight;
}

async function fetchServices() {
  const results = await Promise.allSettled(providers.map(async (p) => {
    const [raw, f] = await Promise.all([p.services(), phpFactor(p)]);
    return raw.map((s) => ({
      sid: `${p.id}:${s.service}`, provider: p.id, pid: Number(s.service),
      name: s.name, category: s.category, type: s.type,
      cost: Number(s.rate) * f,                 // our cost in PHP / 1000
      rate: Number(s.rate) * f * p.multiplier,  // customer price in PHP / 1000
      min: Number(s.min), max: Number(s.max), refill: !!s.refill,
      desc: cleanDesc(s.desc ?? s.description),
      refillDays: Number(s.refill_days) || null,
      cancel: s.cancel === undefined ? null : !!s.cancel,
    }));
  }));
  results.forEach((r, i) => r.status === 'rejected' && console.error('provider failed:', providers[i].id, r.reason.message));
  const list = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (!list.length) throw new Error('No provider available');
  cache = { at: Date.now(), list };
  return list;
}

export const findService = async (sid) => (await getServices()).find((s) => s.sid === sid && orderable(s));

// Provider descriptions come as HTML-ish text with fancy Unicode and template junk.
// Turn them into plain text (the client shows them as text, never as HTML).
const JUNK = /undefined|N\/A Avg|Professional Grade|^[⇝═━─—~\s]+$/i;
function cleanDesc(d) {
  if (!d || typeof d !== 'string') return null;
  const lines = d
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .normalize('NFKC') // 𝐍𝐨𝐭𝐞 -> Note
    .split('\n').map((l) => l.trim())
    .filter((l) => !JUNK.test(l));
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return text.length > 2 ? text.slice(0, 2000) : null;
}

// Hides info/separator rows (e.g. "━━ PH SERVICES ━━") that providers mix into their lists.
export const orderable = (s) => s.type === 'Default' && !/guideline|rules|[━═─—]{2,}/i.test(s.name);
const isPH = (s) => /philippine|pinoy|filipino|\bph\b|🇵🇭/i.test(`${s.category} ${s.name}`);

const PLATFORMS = [
  ['Facebook', /facebook|\bfb\b/], ['Instagram', /instagram|\big\b/], ['TikTok', /tik\s?tok/],
  ['YouTube', /youtube/], ['Telegram', /telegram/], ['WhatsApp', /whats\s?app/],
  ['Twitter / X', /twitter|\btweet|\bx\.com|\bx (likes|followers|views)/], ['Shopee', /shopee/],
  ['Spotify', /spotify/], ['Twitch', /twitch/], ['Discord', /discord/], ['Threads', /threads/],
  ['Snapchat', /snapchat/], ['Pinterest', /pinterest/], ['LinkedIn', /linkedin/], ['Kick', /\bkick\b/],
  ['Lazada', /lazada/], ['Reddit', /reddit/], ['Google', /google/],
];
const platformOf = (s) => {
  // NFKD turns fancy Unicode letters (𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤) into plain ASCII for matching.
  const t = `${s.name} ${s.category}`.normalize('NFKD').toLowerCase();
  return (PLATFORMS.find(([, re]) => re.test(t)) || ['Other'])[0];
};

// Strip badges/emoji/[provider tags] so near-identical categories merge.
const cleanCat = (c) =>
  c.replace(/\[[^\]]*\]/g, '').replace(/ᴺᴱᵂ/g, '').replace(/[^\p{L}\p{N}\s&+/()-]/gu, '')
    .replace(/\s+/g, ' ').trim();

// What customers see. They never see which provider a service comes from.
export const toPublic = (s) => ({
  id: s.sid, name: s.name, category: cleanCat(s.category), platform: platformOf(s), ph: isPH(s),
  type: s.type, rate: round(s.rate), min: s.min, max: s.max, refill: s.refill,
  desc: s.desc, refillDays: s.refillDays, cancel: s.cancel,
});

// What the admin sees: the public shape plus provider, cost and profit.
export const toAdmin = (s) => ({
  ...toPublic(s), provider: s.provider, cost: round(s.cost), profit: round(s.rate - s.cost),
});
