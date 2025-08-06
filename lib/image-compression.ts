export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}

export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'))
        return
      }

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'))
            return
          }

          // Crear nuevo archivo con el blob comprimido
          const compressedFile = new File(
            [blob], 
            `compressed_${file.name.split('.')[0]}.${format}`, 
            {
              type: `image/${format}`,
              lastModified: Date.now()
            }
          )

          resolve(compressedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Error al cargar la imagen'))
    img.crossOrigin = 'anonymous'
    img.src = URL.createObjectURL(file)
  })
}

export function getImageInfo(file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type
      })
    }
    
    img.onerror = () => reject(new Error('Error al obtener información de la imagen'))
    img.src = URL.createObjectURL(file)
  })
}
