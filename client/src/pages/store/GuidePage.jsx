import { FAQ, HOW_IT_WORKS_STEPS } from '../../content/guide.js'

export default function GuidePage() {
  return (
    <>
      <div className="hero">
        <h2>How it works</h2>
        <p className="muted">Ordering takes about two minutes. Follow these steps.</p>
      </div>
      {HOW_IT_WORKS_STEPS.map(([title, text], i) => (
        <div key={title} className="card row stepcard">
          <div className="stepnum">{i + 1}</div>
          <div className="grow"><strong>{title}</strong><div className="muted">{text}</div></div>
        </div>
      ))}
      <div className="row center-row cta">
        <a href="#/"><button>Start an order</button></a>
      </div>
      <h3>Good to know</h3>
      {FAQ.map(([q, a]) => (
        <div key={q} className="card"><strong>{q}</strong><div className="muted">{a}</div></div>
      ))}
    </>
  )
}
