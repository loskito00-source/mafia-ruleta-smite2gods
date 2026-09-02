const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

export interface UploadResult {
  url: string
  publicId: string
}

/**
 * Reescala/comprime en canvas antes de subir. Las fotos de builds suelen
 * venir de un celular (3-8 MB); bajarlas a ~1600px webp ~80% las deja en
 * unos cientos de KB sin verse peor en pantalla, y la subida se siente
 * instantánea en vez de colgarse con el archivo original.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  if (!('createImageBitmap' in window)) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  return blob ?? file
}

export async function uploadBuildImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary no está configurado (faltan variables de entorno).')
  }

  let blob: Blob = file
  try {
    blob = await compressImage(file)
  } catch {
    blob = file
  }

  const form = new FormData()
  form.append('file', blob, 'build.webp')
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'smite2-builds')

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ url: data.secure_url as string, publicId: data.public_id as string })
        } catch {
          reject(new Error('Respuesta inválida de Cloudinary'))
        }
      } else {
        reject(new Error('No se pudo subir la imagen. Intenta de nuevo.'))
      }
    }
    xhr.onerror = () => reject(new Error('Error de red subiendo la imagen'))
    xhr.send(form)
  })
}

function cloudinaryTransform(url: string, transform: string): string {
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/${transform}/`) : url
}

/** Miniatura liviana para grillas. */
export const thumbUrl = (url: string) => cloudinaryTransform(url, 'w_500,q_auto,f_auto,c_limit')

/** Tamaño completo para el lightbox, todavía optimizado. */
export const fullUrl = (url: string) => cloudinaryTransform(url, 'w_1600,q_auto,f_auto,c_limit')
