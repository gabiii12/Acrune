// Customer-facing help text. Edit wording here without touching any components.

// "How it works" page
export const HOW_IT_WORKS_STEPS = [
  ['Pick a platform', 'On the Services page, tap the platform you want to grow (Facebook, Instagram, TikTok…).'],
  ['Choose a service', 'Use the Followers / Likes / Views / Shares buttons to narrow the list. Check the price per 1000, the minimum and maximum, and whether refill is included.'],
  ['Enter your link and quantity', 'Paste the link to your post or profile and enter how many you want. The total price is shown before you pay.'],
  ['Pay with GCash', 'Send the exact amount to the GCash number shown on your order page, then type the GCash reference number and submit.'],
  ['Wait for approval', 'We check your payment and approve the order. Once approved, it starts automatically.'],
  ['Track your order', 'Save your order code. Use the Track order page anytime to see the status.'],
]

export const FAQ = [
  ['Is my account password needed?', 'Never. We only need a public link. Do not share your password with anyone.'],
  ['My profile or post must be public', 'Private accounts and posts cannot receive orders. Set it to public until the order finishes.'],
  ['How long does it take?', 'Approval happens after we verify your payment. Delivery speed then depends on the service; larger quantities take longer.'],
  ['Can I place two orders on the same link at once?', 'Please wait for the first order to finish. Overlapping orders on one link can fail or deliver incorrectly.'],
  ['What do the statuses mean?', 'Awaiting payment: send GCash and submit the reference. Needs review: we are checking your payment. Processing: your order is being delivered. Completed: all done. Partially delivered / Canceled: contact us for a refund. Rejected: payment could not be verified.'],
  ['I lost my order code', 'Open Track order on the same phone or browser you ordered with. Your recent orders are saved there. Otherwise, contact us with your GCash reference number.'],
  ['Wrong link or wrong amount?', 'Contact us right away with your order code before the order starts.'],
]

// Guide panel beside the order form / order page
export const ORDER_STEPS = ['Choose service', 'Enter link & quantity', 'Pay with GCash', 'We verify payment', 'Order delivered']

export const STEP_TIPS = {
  0: ['Paste the link to your public post or profile.', 'Check the quantity is within min and max.', 'Never share your password. A link is all we need.'],
  1: ['Make sure your account or post is public.', 'Check the link is correct before ordering.'],
  2: ['Send the exact total shown to the GCash number.', 'Copy the reference number from your GCash receipt.', 'Press "I\'ve paid" after you enter it.'],
  3: ['We are checking your payment.', 'Keep your order code and check back here.'],
  4: ['Your order is being delivered. Delivery speed depends on quantity.', 'Avoid placing another order on the same link until done.'],
}

// Orders that ended badly get their own message instead of a "done" checklist.
export const STOPPED_MESSAGES = {
  rejected: ['Payment not verified', 'We could not confirm your GCash payment. Check the note on your order, or contact us with your order code.'],
  canceled: ['Order canceled', 'This order was canceled. Since you already paid, we will refund you. Contact us with your order code if you have questions.'],
  customer_canceled: ['Order canceled', 'You canceled this order before paying. Nothing was charged. You can place a new order anytime.'],
  partial: ['Partially delivered', 'Only part of your order was delivered. Contact us with your order code for a refund of the rest.'],
  refunded: ['Refunded', 'This order was refunded. Thank you for your patience.'],
}

// Which ORDER_STEPS index an order status corresponds to.
export const stepForStatus = (status) =>
  ({ awaiting_payment: 2, payment_submitted: 3, approving: 3, processing: 4 })[status] ?? ORDER_STEPS.length
