import { useState } from 'react'
import OrderGuide from '../../components/OrderGuide.jsx'
import RefillTag from '../../components/RefillTag.jsx'
import { navigate } from '../../hooks/useHashRoute.js'
import { api } from '../../lib/api.js'
import { money } from '../../lib/format.js'
import { rememberOrder, storage } from '../../lib/storage.js'

const withProtocol = (link) => (/^https?:\/\//i.test(link) ? link : 'https://' + link)

// Link + quantity + contact for one service. Creates the order and goes to its page.
export default function OrderForm({ service: s, onBack }) {
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(s.min)
  const [contact, setContact] = useState(() => storage.get('contact', ''))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const qty = Number(quantity || 0)
  const qtyOk = Number.isInteger(qty) && qty >= s.min && qty <= s.max
  const linkOk = /^https?:\/\/\S+$/i.test(link.trim())
  const range = `${s.min.toLocaleString()} – ${s.max.toLocaleString()}`
  // A few handy presets inside this service's range.
  const presets = [...new Set([s.min, 100, 500, 1000, 5000, 10000].filter((n) => n >= s.min && n <= s.max))].slice(0, 5)

  async function submit(e) {
    e.preventDefault()
    if (!qtyOk) return setError(`Quantity must be between ${range}.`)
    setError(''); setBusy(true)
    try {
      const r = await api('/orders', {
        method: 'POST',
        body: { serviceId: s.id, link: withProtocol(link.trim()), quantity: qty, contact },
      })
      storage.set('contact', contact.trim())
      rememberOrder({ token: r.token, service: s.name, price: r.price })
      navigate('/order/' + r.token)
    } catch (x) { setError(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="withguide">
      <OrderGuide current={1} />
      <form onSubmit={submit} className="card">
        <button type="button" className="ghost sm" onClick={onBack}>← Back</button>
        <h2>{s.name}</h2>
        <div className="tags">
          <span className="tag">{s.category}</span>
          <span className="tag">{money(s.rate)} per 1000</span>
          <RefillTag service={s} />
          {s.cancel === true && <span className="tag">Cancelable</span>}
        </div>
        {s.desc && (
          <details className="desc" open>
            <summary>About this service</summary>
            <p>{s.desc}</p>
          </details>
        )}

        <p>
          <label>Link to your post or profile
            <input required value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.facebook.com/yourpage" inputMode="url" />
          </label>
          {link && !linkOk && <span className="hint">We'll add https:// for you. Make sure it's the full link.</span>}
        </p>

        <p>
          <label>Quantity <span className="muted">({range})</span>
            <input required type="number" min={s.min} max={s.max} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </p>
        <div className="chips">
          {presets.map((n) => (
            <button type="button" key={n} className={`chip-btn ${qty === n ? 'on' : ''}`} onClick={() => setQuantity(n)}>{n.toLocaleString()}</button>
          ))}
        </div>
        {quantity !== '' && !qtyOk && <p className="err">Enter a whole number between {range}.</p>}

        <p>
          <label>Your contact (email / Telegram / Facebook)
            <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="So we can reach you about this order" />
          </label>
        </p>

        <div className="total">
          <span className="muted">Total to pay</span>
          <strong>{qtyOk ? money((s.rate / 1000) * qty) : '—'}</strong>
        </div>
        {error && <p className="err">{error}</p>}
        <button disabled={busy || !qtyOk} className="block">{busy ? 'Placing…' : 'Place order'}</button>
      </form>
    </div>
  )
}
