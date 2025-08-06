"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface StockAlertModalProps {
  isOpen: boolean
  onClose: () => void
  lowStockItems: Array<{
    product: string
    quantity: number
    min_stock: number
  }>
}

export function StockAlertModal({ isOpen, onClose, lowStockItems }: StockAlertModalProps) {
  const getProductName = (product: string) => {
    return product === "hielo" ? "Hielo" : "Botellón de Agua"
  }

  const getStockLevel = (quantity: number, min_stock: number) => {
    if (quantity === 0) return { level: "Sin Stock", color: "bg-red-500" }
    if (quantity <= min_stock * 0.5) return { level: "Crítico", color: "bg-red-500" }
    if (quantity <= min_stock) return { level: "Bajo", color: "bg-yellow-500" }
    return { level: "Normal", color: "bg-green-500" }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ¡Alerta de Stock Bajo!
          </DialogTitle>
          <DialogDescription>Los siguientes productos tienen stock bajo y requieren reposición:</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {lowStockItems.map((item) => {
            const stockLevel = getStockLevel(item.quantity, item.min_stock)
            return (
              <div key={item.product} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{getProductName(item.product)}</h4>
                  <p className="text-sm text-muted-foreground">
                    Stock actual: {item.quantity} | Mínimo: {item.min_stock}
                  </p>
                </div>
                <Badge className={`${stockLevel.color} text-white`}>{stockLevel.level}</Badge>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
