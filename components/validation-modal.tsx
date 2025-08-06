"use client"

import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ValidationModalProps {
  isOpen: boolean
  onClose: () => void
  type: "error" | "success" | "warning" | "info"
  title: string
  message: string
  details?: string[]
}

export function ValidationModal({ isOpen, onClose, type, title, message, details }: ValidationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case "info":
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getColorClass = () => {
    switch (type) {
      case "error":
        return "text-red-600"
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "info":
        return "text-blue-600"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${getColorClass()}`}>
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>

        {details && details.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Detalles:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
