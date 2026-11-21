import { useEffect, useState } from 'react'

// Tiny hash router: returns the current path after '#', e.g. '/order/abc'. Scrolls to top on change.
export function useHashRoute() {
  const read = () => location.hash.slice(1) || '/'
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => { setPath(read()); scrollTo(0, 0) }
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export const navigate = (path) => { location.hash = path }
