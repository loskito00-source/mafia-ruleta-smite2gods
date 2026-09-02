import { compressImage } from './cloudinary'

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Manda la foto al endpoint /api/track-gods (usa un modelo de visión de Groq
 * del lado del servidor) y devuelve los ids de los dioses reconocidos.
 * Se comprime bastante más chico que la foto que se sube: para reconocer
 * dioses no hace falta resolución alta, y el payload viaja más rápido.
 */
export async function trackGods(file: File): Promise<string[]> {
  let blob: Blob = file
  try {
    blob = await compressImage(file, 1024, 0.75)
  } catch {
    blob = file
  }
  const image = await fileToDataUrl(blob)

  const res = await fetch('/api/track-gods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || 'No se pudieron reconocer los dioses de la foto.')
  }

  const data = await res.json()
  return Array.isArray(data.godIds) ? (data.godIds as string[]) : []
}
