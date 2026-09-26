// Photos are stored inside localStorage as data URLs, so they're shrunk first.
// A phone photo (3–5 MB) ends up around 100–250 KB.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이 사진은 열 수 없어요. JPG나 PNG 파일로 다시 시도해 주세요.'))
    img.src = src
  })
}

export async function imageFileToDataUrl(file, { maxSize = 1280, quality = 0.82 } = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('사진 파일만 올릴 수 있어요.')
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // transparent PNGs shouldn't turn black as JPEG
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
