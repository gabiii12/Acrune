import { useState } from 'react'
import { navigate } from '../../hooks/useHashRoute.js'
import { money } from '../../lib/format.js'
import { getMyOrders } from '../../lib/storage.js'

export default function TrackPage() {
  const [code, setCode] = useState('')
  const myOrders = getMyOrders()

  const submit = (e) => {
    e.preventDefault()
    if (code.trim()) navigate('/order/' + code.trim())
  }

  return (
    <>
      <div className="hero"><h2>Track your order</h2><p className="muted">Paste your order code to see its status.</p></div>
      <form className="card row" onSubmit={submit}>
        <input placeholder="Order code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button>Track order</button>
      </form>

      {myOrders.length > 0 && (
        <>
          <h3>Your recent orders <span className="muted">(saved on this device)</span></h3>
          {myOrders.map((x) => (
            <a key={x.token} href={`#/order/${x.token}`} className="card svc linkcard">
              <div><strong>{x.service}</strong><div className="muted">{new Date(x.at).toLocaleString()} · {x.token.slice(0, 8)}…</div></div>
              <div className="price">{money(x.price)}</div>
            </a>
          ))}
        </>
      )}
    </>
  )
}
