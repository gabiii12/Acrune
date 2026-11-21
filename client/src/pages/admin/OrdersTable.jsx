import StatusBadge from '../../components/StatusBadge.jsx'
import { NEEDS_REFUND } from '../../constants/orderStatus.js'
import { money } from '../../lib/format.js'
import ProofButton from './ProofButton.jsx'

// Orders as a table on desktop, stacked labeled cards on phones (`table.cards` in admin.css).
export default function OrdersTable({ orders, onAction, busyId, headers }) {
  return (
    <div className="glass tablewrap">
      <table className="cards">
        <thead><tr><th>Order ID</th><th>Order</th><th>Payment</th><th>Status</th><th>Provider order</th><th /></tr></thead>
        <tbody>
          {orders.map((o) => <OrderRow key={o.id} o={o} onAction={onAction} busy={busyId === o.id} headers={headers} />)}
          {!orders.length && <tr><td colSpan="6" className="muted empty">No orders.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function OrderRow({ o, onAction, busy, headers }) {
  const act = (action) => () => onAction(action, o)
  return (
    <tr>
      <td data-label="Order">
        <strong>#{o.id}</strong>
        <br /><span className="muted">Code: <a href={`#/order/${o.token}`}>{o.token.slice(0, 8)}</a></span>
        <br /><span className="muted">{o.created_at}</span>
      </td>
      <td data-label="Service">
        {o.service_name} × {o.quantity}
        <br /><span className="muted break">{o.link}</span>
        <br /><span className="muted">Contact: {o.contact}</span>
      </td>
      <td data-label="Payment">
        <strong>{money(o.price)}</strong>
        <br /><span className="muted">{o.payment_ref || 'no ref yet'}</span>
        {o.payment_proof && <><br /><ProofButton id={o.id} refNo={o.payment_ref} price={o.price} headers={headers} /></>}
      </td>
      <td data-label="Status">
        <StatusBadge status={o.status} />
        {o.note && <><br /><span className="muted">{o.note}</span></>}
      </td>
      <td data-label="Provider">
        {o.zsmm_order_id ? <>
          <strong>#{o.zsmm_order_id}</strong><br /><span className="muted">{o.provider}</span>
          {o.provider_status && <><br /><span className="muted">{o.provider_status}{o.remains != null ? ` · ${o.remains} left` : ''}</span></>}
        </> : '—'}
      </td>
      <td className="actions">
        {o.status === 'payment_submitted' && <>
          <button className="sm" disabled={busy} onClick={act('approve')}>Approve</button>{' '}
          <button className="sm danger" disabled={busy} onClick={act('reject')}>Reject</button>
        </>}
        {NEEDS_REFUND.includes(o.status) && (
          <button className="sm" disabled={busy} onClick={act('refunded')}>Mark refunded</button>
        )}
        {o.status === 'processing' && (
          <button className="sm ghost danger-text" disabled={busy} onClick={act('provider-cancel')}>Cancel at provider</button>
        )}
      </td>
    </tr>
  )
}
