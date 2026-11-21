// Provider wallet balances (zsmm, growix, …), shown as chips at the top of admin pages.
export default function ProviderBalances({ balances = [] }) {
  if (!balances.length) return null
  return (
    <div className="balances">
      {balances.map((b) => (
        <span className="chip" key={b.provider} title={b.error || undefined}>
          <b>{b.provider}</b> · {b.error ? 'error' : `${Number(b.balance).toFixed(2)} ${b.currency}`}
        </span>
      ))}
    </div>
  )
}
