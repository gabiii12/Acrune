import { useEffect, useState } from 'react'
import CopyButton from '../../components/CopyButton.jsx'
import { api } from '../../lib/api.js'
import { money } from '../../lib/format.js'
import { compressImage } from '../../lib/image.js'

// GCash instructions + reference number + receipt screenshot. Calls onPaid() when accepted.
export default function PaymentForm({ token, price, onPaid }) {
  const [gcash, setGcash] = useState({})
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { api('/config').then(setGcash).catch(() => {}) }, [])

  async function pickScreenshot(e) {
    const file = e.target.files?.[0]
    setError('')
    if (!file) return setScreenshot(null)
    try { setScreenshot(await compressImage(file)) } catch (x) { setScreenshot(null); setError(x.message) }
  }

  async function submit(e) {
    e.preventDefault(); setError('')
    if (!screenshot) return setError('Please attach a screenshot of your GCash receipt.')
    setSending(true)
    try {
      await api(`/orders/${token}/payment`, { method: 'POST', body: { reference, screenshot } })
      onPaid()
    } catch (x) { setError(x.message) } finally { setSending(false) }
  }

  return (
    <div className="paybox">
      <h3>Pay via GCash</h3>
      {gcash.gcashNumber ? (
        <ol className="paysteps">
          <li>Open GCash and choose <b>Send Money</b>.</li>
          <li>Send exactly <b>{money(price)}</b> <CopyButton text={price.toFixed(2)} label="Copy amount" /></li>
          <li>To <b>{gcash.gcashNumber}</b> {gcash.gcashName && <>({gcash.gcashName})</>} <CopyButton text={gcash.gcashNumber} label="Copy number" /></li>
          <li>Take a screenshot of the GCash receipt, then enter the reference number and attach the screenshot below.</li>
        </ol>
      ) : <p className="muted">GCash details are not available right now. Please contact us.</p>}

      <form onSubmit={submit}>
        <p>
          <label>GCash reference no.
            <input required placeholder="e.g. 1234 567 890123" value={reference} onChange={(e) => setReference(e.target.value)} inputMode="numeric" />
          </label>
        </p>
        <label className={`upload ${screenshot ? 'has' : ''}`}>
          <input type="file" accept="image/*" onChange={pickScreenshot} />
          {screenshot
            ? <><img src={screenshot} alt="Your payment screenshot" /><span>Screenshot attached. Tap to change.</span></>
            : <><b>Attach receipt screenshot</b><span className="muted">Required. It must show the amount and reference number.</span></>}
        </label>
        <button className="block" disabled={sending || !screenshot || !reference.trim()}>{sending ? 'Sending…' : "I've paid"}</button>
      </form>
      {error && <p className="err">{error}</p>}
    </div>
  )
}
