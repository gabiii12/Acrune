// Customer site frame: top bar with the logo and nav (nav becomes a bottom tab bar on phones).
const LINKS = [
  ['services', '#/', 'Services'],
  ['guide', '#/guide', 'How it works'],
  ['track', '#/track', 'Track order'],
]

export default function StoreLayout({ active, children }) {
  return (
    <div className="wrap">
      <nav className="glass topbar">
        <a className="brand" href="#/">SMM Store</a>
        <div className="navlinks">
          {LINKS.map(([key, href, label]) => (
            <a key={key} href={href} className={active === key ? 'active' : ''}>{label}</a>
          ))}
        </div>
      </nav>
      {children}
    </div>
  )
}
