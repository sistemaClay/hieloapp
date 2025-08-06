"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { addNewArea, type Area } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AreaSelectorProps {
  areas: Area[]
  selectedArea: string
  onAreaChange: (areaId: string) => void
  onAreaAdded: (newArea: Area) => void
}

export function AreaSelector({ areas, selectedArea, onAreaChange, onAreaAdded }: AreaSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAreaName, setNewAreaName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const handleAddArea = async () => {
    if (!newAreaName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para el área",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAdding(true)
      const newArea = await addNewArea(newAreaName.trim())
      onAreaAdded(newArea)
      onAreaChange(newArea.id.toString())
      setNewAreaName("")
      setIsDialogOpen(false)
      toast({
        title: "Éxito",
        description: "Área agregada correctamente",
      })
    } catch (error) {
      console.error("Error adding area:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el área",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="area">Área</Label>
      <div className="flex gap-2">
        <Select value={selectedArea} onValueChange={onAreaChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecciona un área" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id.toString()}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Área</DialogTitle>
              <DialogDescription>Ingresa el nombre de la nueva área que deseas agregar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newAreaName">Nombre del Área</Label>
                <Input
                  id="newAreaName"
                  placeholder="Ej: Almacén, Oficinas, etc."
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddArea()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddArea} disabled={isAdding}>
                {isAdding ? "Agregando..." : "Agregar Área"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
