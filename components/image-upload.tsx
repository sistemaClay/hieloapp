"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2, ImageIcon, Info } from 'lucide-react'
import { uploadImage } from "@/lib/supabase"
import { compressImage, getImageInfo } from "@/lib/image-compression"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  required?: boolean
}

export function ImageUpload({ onImageUploaded, currentImage, required = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [imageInfo, setImageInfo] = useState<{
    originalSize: number
    compressedSize: number
    compressionRatio: number
  } | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      })
      return
    }

    try {
      setCompressing(true)
      
      // Obtener información de la imagen original
      const originalInfo = await getImageInfo(file)
      const originalSize = file.size

      // Comprimir imagen si es mayor a 500KB
      let fileToUpload = file
      let compressedSize = originalSize
      
      if (originalSize > 500 * 1024) { // 500KB
        toast({
          title: "Comprimiendo imagen",
          description: "Optimizando imagen para reducir el tamaño...",
        })

        fileToUpload = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'jpeg'
        })
        
        compressedSize = fileToUpload.size
      }

      // Validar tamaño final (máximo 2MB después de compresión)
      if (compressedSize > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen es demasiado grande. Intenta con una imagen más pequeña.",
          variant: "destructive",
        })
        return
      }

      setCompressing(false)
      setUploading(true)

      // Crear preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(fileToUpload)

      // Calcular ratio de compresión
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

      setImageInfo({
        originalSize,
        compressedSize,
        compressionRatio
      })

      // Subir imagen
      const imageUrl = await uploadImage(fileToUpload)
      onImageUploaded(imageUrl)

      toast({
        title: "Éxito",
        description: `Imagen subida correctamente${compressionRatio > 0 ? ` (reducida ${compressionRatio.toFixed(1)}%)` : ''}`,
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen",
        variant: "destructive",
      })
      setPreview(null)
      setImageInfo(null)
    } finally {
      setUploading(false)
      setCompressing(false)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleGallerySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    setImageInfo(null)
    onImageUploaded("")
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = ""
    }
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Fotografía del Producto {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Input oculto para cámara */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
        disabled={uploading || compressing}
      />

      {/* Input oculto para galería */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
        disabled={uploading || compressing}
      />

      {preview ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                crossOrigin="anonymous"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={uploading || compressing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Información de compresión */}
            {imageInfo && imageInfo.compressionRatio > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Info className="h-4 w-4" />
                  <span>Imagen optimizada</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Tamaño original: {formatFileSize(imageInfo.originalSize)} → 
                  Comprimida: {formatFileSize(imageInfo.compressedSize)} 
                  ({imageInfo.compressionRatio.toFixed(1)}% reducción)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {compressing ? (
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                ) : uploading ? (
                  <Loader2 className="h-12 w-12 animate-spin" />
                ) : (
                  <Upload className="h-12 w-12" />
                )}
              </div>
              
              {compressing ? (
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Comprimiendo imagen...</p>
                  <p className="text-xs text-gray-500">Optimizando para reducir el tamaño</p>
                </div>
              ) : uploading ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Subiendo imagen...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Selecciona cómo quieres agregar la imagen</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCameraClick} 
                      disabled={uploading || compressing}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Camera className="h-6 w-6 text-blue-600" />
                      <div className="text-center">
                        <div className="font-medium">Tomar Foto</div>
                        <div className="text-xs text-muted-foreground">Usar cámara</div>
                      </div>
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGalleryClick} 
                      disabled={uploading || compressing}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <ImageIcon className="h-6 w-6 text-green-600" />
                      <div className="text-center">
                        <div className="font-medium">Galería</div>
                        <div className="text-xs text-muted-foreground">Seleccionar imagen</div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Las imágenes se comprimen automáticamente para optimizar el almacenamiento
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
