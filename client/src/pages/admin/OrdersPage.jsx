import { useState } from 'react'
import { NEEDS_REFUND } from '../../constants/orderStatus.js'
import OrdersTable from './OrdersTable.jsx'
import ProviderBalances from './ProviderBalances.jsx'

const TABS = [
  ['all', 'All'], ['payment_submitted', 'Needs review'],
  ['processing', 'In progress'], ['completed', 'Completed'], ['refund', 'Needs refund'],
  ['refunded', 'Refunded'], ['rejected', 'Rejected'],
]
// Orders the customer hasn't paid for yet are just carts; keep them off this page.
const isPaid = (o) => o.status !== 'awaiting_payment'
const inTab = (o, tab) => tab === 'all' || (tab === 'refund' ? NEEDS_REFUND.includes(o.status) : o.status === tab)
const searchText = (o) =>
  `${o.id} ${o.token} ${o.contact} ${o.link} ${o.payment_ref || ''} ${o.zsmm_order_id || ''}`.toLowerCase()

export default function OrdersPage({ orders: allOrders, balances, tableProps }) {
  const orders = allOrders.filter(isPaid)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const list = orders.filter((o) => inTab(o, tab) && (!q || searchText(o).includes(q)))

  return (
    <>
      <h2>Orders</h2>
      <ProviderBalances balances={balances} />
      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
            {label} ({orders.filter((o) => inTab(o, key)).length})
          </button>
        ))}
      </div>
      <p><input placeholder="Search by order #, code, contact, link, reference…" value={query} onChange={(e) => setQuery(e.target.value)} /></p>
      <OrdersTable orders={list} {...tableProps} />
    </>
  )
}
