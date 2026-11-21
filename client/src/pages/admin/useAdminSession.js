import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api.js'

const TOKEN_KEY = 'adm'
const REFRESH_MS = 20_000

// Admin login token + dashboard data (orders and provider balances), auto-refreshed.
export function useAdminSession() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const headers = useMemo(() => ({ 'x-admin-token': token }), [token])

  const login = (t) => { sessionStorage.setItem(TOKEN_KEY, t); setToken(t) }
  const logout = useCallback(() => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); setData(null) }, [])

  const reload = useCallback(() => api('/admin/orders', { headers })
    .then((d) => { setData(d); setError('') })
    .catch((e) => { if (e.message === 'Unauthorized') logout(); else setError(e.message) }), [headers, logout])

  useEffect(() => {
    if (!token) return
    reload()
    const timer = setInterval(reload, REFRESH_MS)
    return () => clearInterval(timer)
  }, [token, reload])

  return { token, headers, data, error, setError, login, logout, reload }
}
