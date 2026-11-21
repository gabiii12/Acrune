import { useCallback, useState } from 'react'

// In-page replacement for confirm()/prompt(), which many phone browsers block or render badly.
//
//   const [dialog, ask] = useDialog()   // render {dialog} somewhere in your component
//   const ok   = await ask({ title, message, confirmLabel, danger })            -> true | null
//   const text = await ask({ title, input: 'default', presets: [...], ... })   -> string | null
export function useDialog() {
  const [d, setD] = useState(null)
  const [value, setValue] = useState('')

  const ask = useCallback((opts) => new Promise((resolve) => {
    setValue(opts.input ?? '')
    setD({ ...opts, resolve })
  }), [])

  const close = (result) => { d.resolve(result); setD(null) }
  const hasInput = d?.input !== undefined

  const dialog = d && (
    <div className="modal" onClick={() => close(null)}>
      <form className="glass modal-box dialog" onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); close(hasInput ? value.trim() : true) }}>
        <h3>{d.title}</h3>
        {d.message && <p className="muted dialog-message">{d.message}</p>}
        {hasInput && (
          <>
            {d.presets && (
              <div className="chips">
                {d.presets.map((p) => (
                  <button type="button" key={p} className={`chip-btn ${value === p ? 'on' : ''}`} onClick={() => setValue(p)}>{p}</button>
                ))}
              </div>
            )}
            <textarea rows="3" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={d.placeholder} maxLength={300} />
          </>
        )}
        <div className="dialog-actions">
          <button type="button" className="ghost" onClick={() => close(null)}>Cancel</button>
          <button className={d.danger ? 'danger' : ''}>{d.confirmLabel || 'OK'}</button>
        </div>
      </form>
    </div>
  )
  return [dialog, ask]
}
