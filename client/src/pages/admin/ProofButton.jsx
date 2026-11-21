import { useEffect, useState } from 'react'
import { money } from '../../lib/format.js'

// Opens the customer's payment screenshot next to the reference number and amount.
// The image needs the admin token, so it's fetched as a blob instead of a plain <img src>.
export default function ProofButton({ id, refNo, price, headers }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => {
    if (!url) return
    const onKey = (e) => e.key === 'Escape' && setUrl(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [url])

  async function open() {
    setError('')
    try {
      const r = await fetch(`/api/admin/orders/${id}/proof`, { headers })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not load screenshot')
      setUrl(URL.createObjectURL(await r.blob()))
    } catch (x) { setError(x.message) }
  }

  return (
    <>
      <button className="ghost sm" onClick={open}>View screenshot</button>
      {error && <><br /><span className="err">{error}</span></>}
      {url && (
        <div className="modal" onClick={() => setUrl(null)}>
          <div className="glass modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row spread">
              <div className="grow">
                <div className="muted">Check that the screenshot matches:</div>
                <strong>Ref: {refNo}</strong> · <strong>{money(price)}</strong>
              </div>
              <button className="ghost sm" onClick={() => setUrl(null)}>Close</button>
            </div>
            <img src={url} alt={`Payment screenshot for order #${id}`} />
            <a href={url} target="_blank" rel="noreferrer">Open full size ↗</a>
          </div>
        </div>
      )}
    </>
  )
}
