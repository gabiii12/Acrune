// Thin wrapper around fetch for our JSON API. Throws an Error with the server's message
// (and `code`, when the server sends one) for any non-2xx response.
export async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code })
  return data
}
