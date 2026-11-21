import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { money } from '../../lib/format.js'

const PAGE_SIZE = 200

// Every orderable service with provider, your cost, the customer price and your profit.
export default function AdminServicesPage({ headers }) {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState('')
  const [phOnly, setPhOnly] = useState(true)

  useEffect(() => {
    api('/admin/services', { headers }).then(setList).catch((e) => setError(e.message))
  }, [headers])

  if (error) return <p className="err">{error}</p>
  if (!list) return <p className="muted">Loading…</p>

  const q = query.toLowerCase()
  const shown = list.filter((s) => (!phOnly || s.ph) && (!provider || s.provider === provider) &&
    (!q || `${s.name} ${s.platform} ${s.id}`.toLowerCase().includes(q)))

  return (
    <>
      <h2>Services & profit</h2>
      <div className="row filters">
        <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">All providers</option>
          {[...new Set(list.map((s) => s.provider))].map((p) => <option key={p}>{p}</option>)}
        </select>
        <button className={phOnly ? '' : 'ghost'} onClick={() => setPhOnly(!phOnly)}>PH only: {phOnly ? 'ON' : 'OFF'}</button>
      </div>
      <p className="muted">All amounts are per 1000, in pesos. Showing {Math.min(shown.length, PAGE_SIZE)} of {shown.length}.</p>
      <div className="glass tablewrap">
        <table className="cards">
          <thead><tr><th>Service</th><th>Provider</th><th>Your cost</th><th>Customer price</th><th>Profit</th><th>Min–Max</th></tr></thead>
          <tbody>
            {shown.slice(0, PAGE_SIZE).map((s) => (
              <tr key={s.id}>
                <td data-label="Service" className="full"><strong>{s.name}</strong><br /><span className="muted">{s.platform} · {s.id}</span></td>
                <td data-label="Provider">{s.provider}</td>
                <td data-label="Your cost">{money(s.cost)}</td>
                <td data-label="Price">{money(s.rate)}</td>
                <td data-label="Profit" className="ok">{money(s.profit)}</td>
                <td data-label="Min–Max">{s.min}–{s.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
