import { useDialog } from '../../hooks/useDialog.jsx'
import AdminLayout from './AdminLayout.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminServicesPage from './AdminServicesPage.jsx'
import OrdersPage from './OrdersPage.jsx'
import OverviewPage from './OverviewPage.jsx'
import { useAdminSession } from './useAdminSession.js'
import { useOrderActions } from './useOrderActions.js'

// Admin dashboard at #/admin, #/admin/orders, #/admin/services.
export default function AdminApp({ page }) {
  const session = useAdminSession()
  const [dialog, ask] = useDialog()
  const actions = useOrderActions({ headers: session.headers, ask, onDone: session.reload, onError: session.setError })

  if (!session.token) return <AdminLogin onLogin={session.login} />

  const { data, headers } = session
  const tableProps = { onAction: actions.run, busyId: actions.busyId, headers }
  const reviewCount = data ? data.orders.filter((o) => o.status === 'payment_submitted').length : 0

  return (
    <AdminLayout page={page} reviewCount={reviewCount} onRefresh={session.reload} onLogout={session.logout}>
      {dialog}
      {session.error && <p className="err">{session.error}</p>}
      {page === 'services' ? <AdminServicesPage headers={headers} />
        : !data ? <p className="muted">Loading…</p>
        : page === 'orders' ? <OrdersPage orders={data.orders} balances={data.balances} tableProps={tableProps} />
        : <OverviewPage data={data} tableProps={tableProps} />}
    </AdminLayout>
  )
}
