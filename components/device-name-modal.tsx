"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Smartphone, Monitor, Tablet } from 'lucide-react'
import { getDeviceInfo, getDeviceFriendlyName, type DeviceInfo } from "@/lib/device-info"

interface DeviceNameModalProps {
  isOpen: boolean
  onClose: (deviceName?: string) => void
}

export function DeviceNameModal({ isOpen, onClose }: DeviceNameModalProps) {
  const [deviceName, setDeviceName] = useState("")
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [suggestedName, setSuggestedName] = useState("")

  useEffect(() => {
    if (isOpen) {
      const info = getDeviceInfo()
      setDeviceInfo(info)
      
      // Generar nombre sugerido
      const friendlyName = getDeviceFriendlyName(info)
      setSuggestedName(friendlyName)
      
      // Verificar si ya hay un nombre guardado
      const savedName = localStorage.getItem(`device_name_${info.device_fingerprint}`)
      if (savedName) {
        setDeviceName(savedName)
      } else {
        setDeviceName(friendlyName)
      }
    }
  }, [isOpen])

  const handleSave = () => {
    if (deviceInfo && deviceName.trim()) {
      // Guardar el nombre del dispositivo localmente
      localStorage.setItem(`device_name_${deviceInfo.device_fingerprint}`, deviceName.trim())
      onClose(deviceName.trim())
    }
  }

  const handleSkip = () => {
    onClose(suggestedName)
  }

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Monitor className="h-8 w-8" />
    
    switch (deviceInfo.device_type) {
      case 'mobile':
        return <Smartphone className="h-8 w-8 text-blue-600" />
      case 'tablet':
        return <Tablet className="h-8 w-8 text-green-600" />
      default:
        return <Monitor className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Identificar Dispositivo
          </DialogTitle>
          <DialogDescription>
            Asigna un nombre personalizado a este dispositivo para identificarlo fácilmente en los reportes.
          </DialogDescription>
        </DialogHeader>

        {deviceInfo && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Información detectada:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Dispositivo:</strong> {deviceInfo.device_model}</div>
                <div><strong>Sistema:</strong> {deviceInfo.os_name} {deviceInfo.os_version}</div>
                <div><strong>Navegador:</strong> {deviceInfo.browser} {deviceInfo.browser_version}</div>
                <div><strong>Pantalla:</strong> {deviceInfo.screen_resolution}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceName">Nombre personalizado</Label>
              <Input
                id="deviceName"
                placeholder="Ej: iPhone de Juan, Samsung A24 Oficina, etc."
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                Este nombre aparecerá en los reportes para identificar desde qué dispositivo se realizaron los movimientos.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Usar nombre automático
          </Button>
          <Button onClick={handleSave} disabled={!deviceName.trim()}>
            Guardar nombre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
