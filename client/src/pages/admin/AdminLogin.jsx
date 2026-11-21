import { useState } from 'react'
import { api } from '../../lib/api.js'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    try {
      const r = await api('/admin/login', { method: 'POST', body: { password } })
      onLogin(r.token)
    } catch (x) { setError(x.message) }
  }

  return (
    <form onSubmit={submit} className="glass login">
      <h2>Admin login</h2>
      <p><input type="password" autoComplete="current-password" autoFocus placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></p>
      <button className="block">Log in</button>
      {error && <p className="err">{error}</p>}
    </form>
  )
}
