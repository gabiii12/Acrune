// Sidebar on desktop; on phones a slim top bar plus a bottom tab bar (see admin.css).
const PAGES = [
  ['overview', '#/admin', 'Overview'],
  ['orders', '#/admin/orders', 'Orders'],
  ['services', '#/admin/services', 'Services'],
]

export default function AdminLayout({ page, reviewCount, onRefresh, onLogout, children }) {
  const click = (fn) => (e) => { e.preventDefault(); fn() }
  return (
    <div className="admin">
      <aside className="glass side">
        <span className="brand">Admin</span>
        <nav className="side-main">
          {PAGES.map(([key, href, label]) => (
            <a key={key} href={href} className={page === key ? 'active' : ''}>
              {label}
              {key === 'orders' && reviewCount > 0 && <span className="badge payment_submitted count">{reviewCount}</span>}
            </a>
          ))}
        </nav>
        <span className="spacer" />
        <div className="side-tools">
          <a href="#/">View site</a>
          <a href="#/admin" onClick={click(onRefresh)}>Refresh</a>
          <a href="#/admin" onClick={click(onLogout)}>Log out</a>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  )
}
