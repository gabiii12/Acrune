export default function RefillTag({ service: s }) {
  if (!s.refill) return null
  return <span className="tag good">Refill{s.refillDays ? ` ${s.refillDays} days` : ''}</span>
}
