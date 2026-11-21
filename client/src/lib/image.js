// Shrink a photo/screenshot to a JPEG data URL (max 1600px) so uploads stay small on mobile data.
export async function compressImage(file, maxSide = 1600) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((ok, bad) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => bad(new Error('Could not read that image. Try a JPG or PNG screenshot.'))
      i.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally { URL.revokeObjectURL(url) }
}
