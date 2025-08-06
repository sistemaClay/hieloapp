"use client"

import { useState } from "react"
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
import { Lock, Eye, EyeOff } from 'lucide-react'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const VALID_PASSWORDS = [
  "455126032",
  "454946123", 
  "1002199809"
]

export function PasswordModal({ isOpen, onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (VALID_PASSWORDS.includes(password)) {
      setPassword("")
      setError("")
      setAttempts(0)
      onSuccess()
    } else {
      setAttempts(prev => prev + 1)
      setError(`Contraseña incorrecta. Intento ${attempts + 1}/3`)
      setPassword("")
      
      if (attempts >= 2) {
        setError("Demasiados intentos fallidos. Contacta al administrador.")
        setTimeout(() => {
          setAttempts(0)
          setError("")
          onClose()
        }, 3000)
      }
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setAttempts(0)
    onClose()
  }

  // Solo permitir números
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // Solo números
    setPassword(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Autorización Requerida
          </DialogTitle>
          <DialogDescription>
            Para registrar una entrada, ingresa una de las contraseñas de autorización válidas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña (Solo números)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ingresa la contraseña numérica"
                value={password}
                onChange={handlePasswordChange}
                className={error ? "border-red-500" : ""}
                disabled={attempts >= 3}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!password.trim() || attempts >= 3}
            >
              Verificar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
