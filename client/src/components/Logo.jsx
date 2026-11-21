import { useState } from 'react'
import { BRANDS } from '../constants/brands.js'

// Platform logo tile. Falls back to the first letter if the icon can't load.
export default function Logo({ name, size = 56 }) {
  const [slug, color] = BRANDS[name] || [null, '#6b7280']
  const [failed, setFailed] = useState(false)
  return (
    <span className="logo" style={{ background: color, width: size, height: size }}>
      {slug && !failed
        ? <img src={`https://cdn.simpleicons.org/${slug}/white`} alt={name} width={size * 0.55} height={size * 0.55} onError={() => setFailed(true)} />
        : <b>{name[0]}</b>}
    </span>
  )
}
