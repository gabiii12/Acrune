import { STATUS_LABELS } from '../constants/orderStatus.js'

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{STATUS_LABELS[status] || status}</span>
}
