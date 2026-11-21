import { ORDER_STEPS, STEP_TIPS, STOPPED_MESSAGES } from '../content/guide.js'

// Step-by-step guide shown beside the order form and the order page.
export default function OrderGuide({ current, status }) {
  const stopped = STOPPED_MESSAGES[status]
  const finished = current >= ORDER_STEPS.length
  return (
    <aside className="card guide-side">
      <h3>Guide</h3>
      <ol className="gsteps">
        {ORDER_STEPS.map((title, i) => (
          <li key={title} className={i < current ? 'done' : i === current ? 'now' : ''}>
            <span className="n">{i + 1}</span>{title}
          </li>
        ))}
      </ol>
      <div className={`tips ${stopped ? 'stop' : ''}`}>
        <strong>{stopped ? stopped[0] : finished ? 'All done' : 'What to do now'}</strong>
        {stopped
          ? <p className="muted">{stopped[1]}</p>
          : <ul>{(STEP_TIPS[current] || ['Your order is complete. Thanks for ordering!']).map((t) => <li key={t}>{t}</li>)}</ul>}
      </div>
      <a href="#/guide">Full guide →</a>
    </aside>
  )
}
