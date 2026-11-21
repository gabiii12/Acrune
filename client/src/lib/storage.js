// Browser-only memory (recent order codes, the customer's contact). Fails quietly in private mode.
export const storage = {
  get: (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ } },
}

const MY_ORDERS = 'myOrders'

export const getMyOrders = () => storage.get(MY_ORDERS, [])

export function rememberOrder(o) {
  const rest = getMyOrders().filter((x) => x.token !== o.token)
  storage.set(MY_ORDERS, [{ token: o.token, service: o.service, price: o.price, at: Date.now() }, ...rest].slice(0, 20))
}

export const forgetOrder = (token) => storage.set(MY_ORDERS, getMyOrders().filter((x) => x.token !== token))
