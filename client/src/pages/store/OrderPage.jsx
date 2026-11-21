import { useCallback, useEffect, useState } from 'react'
import CopyButton from '../../components/CopyButton.jsx'
import OrderGuide from '../../components/OrderGuide.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { FINAL_STATUSES } from '../../constants/orderStatus.js'
import { stepForStatus } from '../../content/guide.js'
import { useDialog } from '../../hooks/useDialog.jsx'
import { api } from '../../lib/api.js'
import { money } from '../../lib/format.js'
import { forgetOrder, rememberOrder } from '../../lib/storage.js'
import PaymentForm from './PaymentForm.jsx'

const POLL_MS = 30_000

// A customer's order: status, delivery progress, payment and cancel.
export default function OrderPage({ token }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [canceling, setCanceling] = useState(false)
  const [erased, setErased] = useState(false)
  const [dialog, ask] = useDialog()

  const load = useCallback(() => api('/orders/' + token)
    .then((o) => { setOrder(o); rememberOrder(o) })
    .catch((e) => { if (e.message === 'Order not found') forgetOrder(token); setError(e.message) }), [token])

  useEffect(() => { load() }, [load])

  // Keep the page live while the order is still moving.
  const live = order && !FINAL_STATUSES.includes(order.status)
  useEffect(() => {
    if (!live) return
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [live, load])

  async function cancelOrder() {
    const ok = await ask({
      title: 'Cancel this order?',
      message: order.status === 'payment_submitted'
        ? 'Since you already paid, we will refund you by GCash. Your order details are deleted after the refund.'
        : 'You have not paid yet, so nothing will be charged. Your order details will be deleted.',
      confirmLabel: 'Yes, cancel order', danger: true,
    })
    if (!ok) return
    setError(''); setCanceling(true)
    try {
      const r = await api(`/orders/${token}/cancel`, { method: 'POST' })
      if (r.erased) { forgetOrder(token); setErased(true) } else load()
    } catch (x) { setError(x.message) } finally { setCanceling(false) }
  }

  if (erased) return (
    <div className="card center">
      <h2>Order canceled</h2>
      <p className="muted">Nothing was charged, and your order details have been deleted.</p>
      <a href="#/"><button>Browse services</button></a>
    </div>
  )
  if (error && !order) return (
    <div className="card center">
      <p className="err">{error}</p>
      <p className="muted">Check that you copied the whole order code.</p>
      <a href="#/track"><button className="ghost">Back to Track order</button></a>
    </div>
  )
  if (!order) return <p className="muted">Loading…</p>

  const o = order
  const delivered = o.progress?.remains != null ? Math.max(0, o.quantity - o.progress.remains) : null
  const cancelable = o.status === 'awaiting_payment' || o.status === 'payment_submitted'

  return (
    <div className="withguide">
      {dialog}
      <OrderGuide current={stepForStatus(o.status)} status={o.status} />
      <div className="card">
        <div className="row spread">
          <h2 className="grow">Your order</h2>
          <StatusBadge status={o.status} />
        </div>

        <div className="codebox">
          <div>
            <span className="muted">Order code: save this to track your order</span>
            <strong className="code">{o.token}</strong>
          </div>
          <CopyButton text={o.token} label="Copy code" />
        </div>

        <dl className="facts">
          <dt>Service</dt><dd>{o.service}</dd>
          <dt>Quantity</dt><dd>{o.quantity.toLocaleString()}</dd>
          <dt>Link</dt><dd className="break">{o.link}</dd>
          <dt>Total</dt><dd><strong>{money(o.price)}</strong></dd>
        </dl>

        {delivered !== null && (
          <div className="progress">
            <div className="row spread">
              <span>Delivery: {o.progress.status}</span>
              <span className="muted">{delivered.toLocaleString()} / {o.quantity.toLocaleString()}</span>
            </div>
            <div className="bar"><i style={{ width: `${Math.min(100, (delivered / o.quantity) * 100)}%` }} /></div>
          </div>
        )}
        {o.note && <p className="note">{o.note}</p>}

        {o.status === 'awaiting_payment' && <PaymentForm token={token} price={o.price} onPaid={load} />}
        {o.status === 'payment_submitted' && (
          <p className="ok">Payment received for review. We'll start your order once it's verified. This page updates by itself.</p>
        )}

        {cancelable && (
          <div className="cancelbox">
            <span className="muted">
              {o.status === 'awaiting_payment'
                ? 'Changed your mind? You can cancel before paying.'
                : 'You can still cancel until we approve it. You will get a full refund.'}
            </span>
            <button type="button" className="ghost sm danger-text" disabled={canceling} onClick={cancelOrder}>
              {canceling ? 'Canceling…' : 'Cancel order'}
            </button>
          </div>
        )}
        {(o.status === 'processing' || o.status === 'approving') && (
          <p className="muted">Your order has started, so it can't be canceled here. If there's a problem, contact us with your order code.</p>
        )}
        {error && <p className="err">{error}</p>}
      </div>
    </div>
  )
}
