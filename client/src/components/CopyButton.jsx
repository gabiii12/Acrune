import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(String(text)).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  })
  return <button type="button" className="ghost sm" onClick={copy}>{copied ? 'Copied' : label}</button>
}
