import { useMemo, useState } from 'react'
import Logo from '../../components/Logo.jsx'
import RefillTag from '../../components/RefillTag.jsx'
import { TYPE_LABELS, serviceType } from '../../constants/serviceTypes.js'
import { money } from '../../lib/format.js'

const PAGE_SIZE = 100

// One platform's services with type chips, search, category and price sorting.
export default function ServiceList({ platform, services, phButton, onBack, onSelect }) {
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('')

  const categories = useMemo(() => [...new Set(services.map((s) => s.category))].sort(), [services])
  const typeCounts = useMemo(() => {
    const counts = {}
    services.forEach((s) => { const t = serviceType(s); counts[t] = (counts[t] || 0) + 1 })
    return counts
  }, [services])

  const list = useMemo(() => {
    const q = query.toLowerCase()
    const out = services.filter((s) =>
      (!type || serviceType(s) === type) &&
      (!category || s.category === category) &&
      (!q || (s.name + s.category).toLowerCase().includes(q)))
    if (sort === 'low') out.sort((a, b) => a.rate - b.rate)
    if (sort === 'high') out.sort((a, b) => b.rate - a.rate)
    return out
  }, [services, query, category, type, sort])

  const clearFilters = () => { setQuery(''); setCategory(''); setType('') }

  return (
    <>
      <div className="row">
        <button className="ghost" onClick={onBack}>← All platforms</button>
        <h2 className="platform-title"><Logo name={platform} size={38} /> {platform}</h2>
        {phButton}
      </div>

      <div className="chips">
        <button className={`chip-btn ${type ? '' : 'on'}`} onClick={() => setType('')}>All <span>{services.length}</span></button>
        {TYPE_LABELS.filter((t) => typeCounts[t]).map((t) => (
          <button key={t} className={`chip-btn ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t} <span>{typeCounts[t]}</span></button>
        ))}
      </div>

      <div className="row filters">
        <input placeholder={`Search ${platform} services…`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: recommended</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      {list.slice(0, PAGE_SIZE).map((s) => (
        <button key={s.id} type="button" className="card svc" onClick={() => onSelect(s)}>
          <div>
            <strong>{s.name}</strong>
            <div className="tags">
              <span className="tag">{s.category}</span>
              <span className="tag">min {s.min.toLocaleString()} · max {s.max.toLocaleString()}</span>
              <RefillTag service={s} />
              {s.desc && <span className="tag info">Details</span>}
            </div>
          </div>
          <div className="price">{money(s.rate)}<small>per 1000</small></div>
        </button>
      ))}

      {!list.length && (
        <div className="card center">
          <p className="muted">No services match.</p>
          <button className="ghost" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
      {list.length > PAGE_SIZE && <p className="muted">Showing {PAGE_SIZE} of {list.length}. Refine your search.</p>}
    </>
  )
}
