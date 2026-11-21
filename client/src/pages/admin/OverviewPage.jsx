import { NEEDS_REFUND } from '../../constants/orderStatus.js'
import { navigate } from '../../hooks/useHashRoute.js'
import { money } from '../../lib/format.js'
import OrdersTable from './OrdersTable.jsx'
import ProviderBalances from './ProviderBalances.jsx'

const SOLD = ['processing', 'completed', 'partial']

export default function OverviewPage({ data, tableProps }) {
  const orders = data.orders
  const count = (status) => orders.filter((o) => o.status === status).length
  const review = orders.filter((o) => o.status === 'payment_submitted')
  const refunds = orders.filter((o) => NEEDS_REFUND.includes(o.status))
  const sales = orders.filter((o) => SOLD.includes(o.status)).reduce((sum, o) => sum + o.price, 0)

  const stats = [
    ['Needs review', review.length, 'var(--warn)'],
    ['Awaiting payment', count('awaiting_payment')],
    ['In progress', count('processing')],
    ['Completed', count('completed')],
    ['Needs refund', refunds.length, refunds.length ? 'var(--err)' : undefined],
    ['Sales', money(sales)],
  ]

  return (
    <>
      <h2>Overview</h2>
      <ProviderBalances balances={data.balances} />

      <div className="stats">
        {stats.map(([label, value, color]) => (
          <div key={label} className="glass stat">
            <div className="muted">{label}</div>
            <div className="v" style={color ? { color } : undefined}>{value}</div>
          </div>
        ))}
      </div>

      <h3>Needs your review</h3>
      {review.length ? <OrdersTable orders={review} {...tableProps} /> : <p className="muted">Nothing waiting.</p>}

      {refunds.length > 0 && (
        <>
          <h3>Needs a refund</h3>
          <p className="muted">The provider canceled or only partly delivered these. Send the customer their money back, then mark them refunded.</p>
          <OrdersTable orders={refunds} {...tableProps} />
        </>
      )}
      <p><button className="ghost" onClick={() => navigate('/admin/orders')}>See all orders →</button></p>
    </>
  )
}
