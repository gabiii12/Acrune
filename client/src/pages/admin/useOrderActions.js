import { useState } from 'react'
import { api } from '../../lib/api.js'
import { money } from '../../lib/format.js'

const REJECT_REASONS = [
  'Payment could not be verified',
  'Amount does not match',
  'Reference number does not match',
  'Screenshot is unclear or invalid',
]

// Approve / reject / refund / provider-cancel, each with its confirmation dialog.
// `ask` comes from useDialog(); `onDone` reloads the dashboard; `onError` shows a message.
export function useOrderActions({ headers, ask, onDone, onError }) {
  const [busyId, setBusyId] = useState(null)

  const post = (id, action, body = {}) =>
    api(`/admin/orders/${id}/${action}`, { method: 'POST', headers, body })

  // Returns the request body to send, or null if the admin backed out.
  async function confirmAction(action, order) {
    const id = order.id
    if (action === 'reject') {
      const note = await ask({
        title: `Reject order #${id}?`,
        message: 'The customer will see this reason.',
        input: REJECT_REASONS[0], presets: REJECT_REASONS, placeholder: 'Reason for rejecting',
        confirmLabel: 'Reject order', danger: true,
      })
      return note === null ? null : { note }
    }
    if (action === 'refunded' && order.customer_canceled) {
      const ok = await ask({
        title: `Refund order #${id}?`,
        message: `The customer canceled this order.\n\nOnly continue after you have sent ${money(order.price)} back by GCash. The order and its payment screenshot will be permanently deleted.`,
        confirmLabel: 'I refunded, delete it', danger: true,
      })
      return ok ? { note: 'Refunded' } : null
    }
    if (action === 'refunded') {
      const note = await ask({
        title: `Mark order #${id} as refunded?`,
        message: 'Note shown to the customer, for example the GCash reference of your refund.',
        input: 'Refunded via GCash', placeholder: 'Refund note', confirmLabel: 'Mark refunded',
      })
      return note === null ? null : { note }
    }
    if (action === 'provider-cancel') {
      const ok = await ask({
        title: `Cancel order #${id} at the provider?`,
        message: 'Not every service allows it. If it works, the order moves to "Needs refund" so you can pay the customer back.',
        confirmLabel: 'Ask provider to cancel', danger: true,
      })
      return ok ? {} : null
    }
    return {} // approve: no confirmation
  }

  async function run(action, order) {
    if (busyId) return
    const body = await confirmAction(action, order)
    if (body === null) return
    onError('')
    setBusyId(order.id)
    try {
      await post(order.id, action, body)
    } catch (x) {
      if (x.code !== 'price_up') onError(x.message)
      // Provider got more expensive since the customer ordered: let the admin decide.
      else if (await ask({
        title: 'Provider price went up',
        message: `${x.message}\n\nApprove anyway? You will lose the difference.`,
        confirmLabel: 'Approve anyway', danger: true,
      })) {
        await post(order.id, action, { force: true }).catch((y) => onError(y.message))
      }
    } finally { setBusyId(null) }
    onDone()
  }

  return { run, busyId }
}
