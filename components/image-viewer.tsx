"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye } from "lucide-react"

interface ImageViewerProps {
  imageUrl: string
  alt: string
}

export function ImageViewer({ imageUrl, alt }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fotografía del Movimiento</DialogTitle>
          <DialogDescription>Imagen adjunta al registro</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={alt}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            crossOrigin="anonymous"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
