// Order statuses as stored by the server, with the label customers and admins see.
export const STATUS_LABELS = {
  awaiting_payment: 'Awaiting payment',
  payment_submitted: 'Needs review',
  approving: 'Starting…',
  processing: 'Processing',
  completed: 'Completed',
  partial: 'Partially delivered',
  canceled: 'Canceled',
  refunded: 'Refunded',
  rejected: 'Rejected',
  customer_canceled: 'Canceled',
}

// Statuses that will not change any more (no need to keep polling).
export const FINAL_STATUSES = ['completed', 'partial', 'canceled', 'refunded', 'rejected', 'customer_canceled']

// Orders the admin still owes money back on.
export const NEEDS_REFUND = ['canceled', 'partial']
