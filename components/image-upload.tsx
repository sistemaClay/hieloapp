"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { uploadImage } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  required?: boolean
}

export function ImageUpload({ onImageUploaded, currentImage, required = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Crear preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Subir imagen
      const imageUrl = await uploadImage(file)
      onImageUploaded(imageUrl)

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    onImageUploaded("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Fotografía del Producto {required && <span className="text-red-500">*</span>}
      </Label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
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
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {uploading ? <Loader2 className="h-12 w-12 animate-spin" /> : <Upload className="h-12 w-12" />}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {uploading ? "Subiendo imagen..." : "Haz clic para seleccionar una imagen"}
                </p>
                <Button type="button" variant="outline" onClick={handleButtonClick} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Seleccionar Imagen
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF hasta 5MB</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
