import { useMemo } from 'react'
import Logo from '../../components/Logo.jsx'

// Grid of platform tiles, busiest platform first.
export default function PlatformPicker({ services, phButton, onPick }) {
  const platforms = useMemo(() => {
    const counts = {}
    services.forEach((s) => { counts[s.platform] = (counts[s.platform] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [services])

  return (
    <>
      <div className="hero">
        <h2>Boost your socials</h2>
        <p className="muted">Pick a platform, choose a service, and pay with GCash. <a href="#/guide">New here? See how it works →</a></p>
      </div>
      <div className="row center-row">{phButton}</div>
      <div className="grid">
        {platforms.map(([name, count]) => (
          <button key={name} className="plat" onClick={() => onPick(name)}>
            <Logo name={name} />
            <strong>{name}</strong>
            <span className="muted">{count} services</span>
          </button>
        ))}
      </div>
    </>
  )
}
