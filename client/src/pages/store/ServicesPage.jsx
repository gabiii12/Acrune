import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api.js'
import OrderForm from './OrderForm.jsx'
import PlatformPicker from './PlatformPicker.jsx'
import ServiceList from './ServiceList.jsx'

// Home page: pick a platform -> pick a service -> order form.
export default function ServicesPage() {
  const [services, setServices] = useState(null)
  const [error, setError] = useState('')
  const [phOnly, setPhOnly] = useState(true)
  const [platform, setPlatform] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = () => api('/services').then(setServices).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const visible = useMemo(() => (services || []).filter((s) => !phOnly || s.ph), [services, phOnly])

  function togglePh() {
    const next = !phOnly
    setPhOnly(next)
    // Stay on this platform unless it has nothing to show with the new filter.
    if (platform && !(services || []).some((s) => s.platform === platform && (!next || s.ph))) setPlatform(null)
  }

  const phButton = (
    <button className={phOnly ? '' : 'ghost'} onClick={togglePh}>
      PH-based only: {phOnly ? 'ON' : 'OFF'}
    </button>
  )

  if (error) return (
    <div className="card center">
      <p className="err">Couldn't load services: {error}</p>
      <button onClick={() => { setError(''); load() }}>Try again</button>
    </div>
  )
  if (!services) return (
    <>
      <div className="hero"><h2>Boost your socials</h2><p className="muted">Loading services…</p></div>
      <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="plat skeleton" />)}</div>
    </>
  )
  if (selected) return <OrderForm service={selected} onBack={() => setSelected(null)} />
  if (!platform) return <PlatformPicker services={visible} phButton={phButton} onPick={setPlatform} />
  return (
    <ServiceList
      key={`${platform}-${phOnly}`} // reset filters when the platform or PH filter changes
      platform={platform}
      services={visible.filter((s) => s.platform === platform)}
      phButton={phButton}
      onBack={() => setPlatform(null)}
      onSelect={setSelected}
    />
  )
}
