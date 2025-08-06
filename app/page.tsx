"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Package, TrendingDown, TrendingUp, Snowflake, Droplets, AlertTriangle, RefreshCw, MapPin, ArrowDown, ArrowUp, Smartphone } from 'lucide-react'
import {
  supabase,
  type InventoryItem,
  type Movement,
  type Area,
  checkTablesExist,
  initializeDefaultData,
  insertMovementWithDeviceInfo,
} from "@/lib/supabase"
import { StockAlertModal } from "@/components/stock-alert-modal"
import { AreaSelector } from "@/components/area-selector"
import { ImageUpload } from "@/components/image-upload"
import { ImageViewer } from "@/components/image-viewer"
import { useToast } from "@/hooks/use-toast"
import { ValidationModal } from "@/components/validation-modal"
import { Reports } from "@/components/reports"
import { CompanyLogo } from "@/components/company-logo"
import { PasswordModal } from "@/components/password-modal"

export default function InventoryControl() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<
    Array<{
      product: string
      quantity: number
      min_stock: number
    }>
  >([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    type: "",
    area: "",
    hieloQuantity: "",
    botellonQuantity: "",
    imageUrl: "",
    notes: "",
  })

  const [dbInitialized, setDbInitialized] = useState(false)
  const [initializingDb, setInitializingDb] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    type: "error" as "error" | "success" | "warning" | "info",
    title: "",
    message: "",
    details: [] as string[],
  })

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState<any>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Verificar stock bajo cada vez que cambie el inventario
  useEffect(() => {
    checkLowStock()
  }, [inventory])

  const loadData = async () => {
    try {
      setLoading(true)
      setDbError(null)

      // Verificar si las tablas existen
      const tablesExist = await checkTablesExist()

      if (!tablesExist) {
        setDbError("Las tablas de la base de datos no existen. Por favor ejecuta los scripts SQL primero.")
        return
      }

      // Inicializar datos por defecto si es necesario
      if (!dbInitialized) {
        setInitializingDb(true)
        const initialized = await initializeDefaultData()
        if (!initialized) {
          setDbError("Error al inicializar los datos por defecto")
          return
        }
        setDbInitialized(true)
        setInitializingDb(false)
      }

      // Cargar inventario
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .order("product")

      if (inventoryError) throw inventoryError

      // Cargar áreas
      const { data: areasData, error: areasError } = await supabase.from("areas").select("*").order("name")

      if (areasError) throw areasError

      // Cargar movimientos (últimos 50) con información del área
      const { data: movementsData, error: movementsError } = await supabase
        .from("movements")
        .select(`
          *,
          areas (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (movementsError) throw movementsError

      setInventory(inventoryData || [])
      setAreas(areasData || [])
      setMovements(movementsData || [])
      setDbInitialized(true)
    } catch (error) {
      console.error("Error loading data:", error)
      setDbError(`Error al cargar los datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setInitializingDb(false)
    }
  }

  const checkLowStock = () => {
    const lowStock = inventory.filter((item) => item.quantity <= item.min_stock)
    if (lowStock.length > 0) {
      setLowStockItems(lowStock)
      setShowStockAlert(true)
    }
  }

  const showValidationModal = (
    type: "error" | "success" | "warning" | "info",
    title: string,
    message: string,
    details?: string[],
  ) => {
    setValidationModal({
      isOpen: true,
      type,
      title,
      message,
      details: details || [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.type) {
      showValidationModal("error", "Campos Requeridos", "Por favor completa todos los campos obligatorios", [
        "Selecciona el tipo de movimiento",
      ])
      return
    }

    if (formData.type === "salida" && !formData.area) {
      showValidationModal("error", "Área Requerida", "Para las salidas debes seleccionar un área", [
        "Selecciona el área de destino",
      ])
      return
    }

    if (!formData.imageUrl) {
      showValidationModal("error", "Fotografía Requerida", "La fotografía del producto es obligatoria", [
        "Sube una imagen del producto antes de continuar",
      ])
      return
    }

    const hieloQty = formData.hieloQuantity ? Number.parseInt(formData.hieloQuantity) : 0
    const botellonQty = formData.botellonQuantity ? Number.parseInt(formData.botellonQuantity) : 0

    if (hieloQty === 0 && botellonQty === 0) {
      showValidationModal("warning", "Cantidad Requerida", "Debes ingresar al menos una cantidad", [
        "Ingresa cantidad de hielo",
        "Ingresa cantidad de botellones",
        "O ambos productos",
      ])
      return
    }

    // Verificar límites máximos
    if (hieloQty > 50) {
      showValidationModal("error", "Cantidad Excedida", "No puedes ingresar más de 50 bolsas de hielo en una sola operación", [
        `Cantidad solicitada: ${hieloQty} bolsas`,
        "Máximo permitido: 50 bolsas por operación"
      ])
      return
    }

    if (botellonQty > 50) {
      showValidationModal("error", "Cantidad Excedida", "No puedes ingresar más de 50 botellones en una sola operación", [
        `Cantidad solicitada: ${botellonQty} botellones`,
        "Máximo permitido: 50 botellones por operación"
      ])
      return
    }

    // Si es entrada, solicitar contraseña
    if (formData.type === "entrada") {
      setPendingSubmission({
        type: formData.type,
        area_id: 1,
        hielo_quantity: hieloQty,
        botellon_quantity: botellonQty,
        image_url: formData.imageUrl,
        notes: formData.notes || undefined,
      })
      setShowPasswordModal(true)
      return
    }

    try {
      setSubmitting(true)

      // Obtener inventario actual
      const hieloItem = inventory.find((item) => item.product === "hielo")
      const botellonItem = inventory.find((item) => item.product === "botellon")

      if (!hieloItem || !botellonItem) {
        throw new Error("Productos no encontrados en inventario")
      }

      // Verificar stock suficiente para salidas
      if (formData.type === "salida") {
        const errors = []

        if (hieloQty > 0 && hieloItem.quantity < hieloQty) {
          errors.push(`Hielo: Solo hay ${hieloItem.quantity} bolsas disponibles, solicitas ${hieloQty}`)
        }

        if (botellonQty > 0 && botellonItem.quantity < botellonQty) {
          errors.push(`Botellones: Solo hay ${botellonItem.quantity} unidades disponibles, solicitas ${botellonQty}`)
        }

        if (errors.length > 0) {
          showValidationModal(
            "error",
            "Stock Insuficiente",
            "No hay suficiente inventario para completar esta salida",
            errors,
          )
          return
        }
      }

      // Insertar movimiento con información del dispositivo
      await insertMovementWithDeviceInfo({
        type: formData.type,
        area_id: formData.type === "entrada" ? 1 : Number.parseInt(formData.area),
        hielo_quantity: hieloQty,
        botellon_quantity: botellonQty,
        image_url: formData.imageUrl,
        notes: formData.notes || undefined,
      })

      // Actualizar inventario
      const updates = []

      if (hieloQty > 0) {
        const newHieloQuantity =
          formData.type === "entrada" ? hieloItem.quantity + hieloQty : Math.max(0, hieloItem.quantity - hieloQty)

        updates.push(supabase.from("inventory").update({ quantity: newHieloQuantity }).eq("product", "hielo"))
      }

      if (botellonQty > 0) {
        const newBotellonQuantity =
          formData.type === "entrada"
            ? botellonItem.quantity + botellonQty
            : Math.max(0, botellonItem.quantity - botellonQty)

        updates.push(supabase.from("inventory").update({ quantity: newBotellonQuantity }).eq("product", "botellon"))
      }

      // Ejecutar todas las actualizaciones
      const results = await Promise.all(updates)
      const errors = results.filter((result) => result.error)

      if (errors.length > 0) {
        throw new Error("Error al actualizar inventario")
      }

      // Recargar datos
      await loadData()

      // Limpiar formulario
      setFormData({
        type: "",
        area: "",
        hieloQuantity: "",
        botellonQuantity: "",
        imageUrl: "",
        notes: "",
      })

      showValidationModal(
        "success",
        "Movimiento Registrado",
        "El movimiento se ha registrado correctamente",
        [
          `Tipo: ${formData.type === "entrada" ? "Entrada" : "Salida"}`,
          `Área: ${areas.find((a) => a.id.toString() === formData.area)?.name}`,
          hieloQty > 0 ? `Hielo: ${hieloQty} bolsas` : "",
          botellonQty > 0 ? `Botellones: ${botellonQty} unidades` : "",
        ].filter(Boolean),
      )
    } catch (error) {
      console.error("Error submitting movement:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getInventoryByProduct = (product: string) => {
    return inventory.find((item) => item.product === product)?.quantity || 0
  }

  const getTotalMovements = (type: "entrada" | "salida") => {
    const today = new Date().toISOString().split("T")[0]
    return movements.filter((m) => m.type === type && m.created_at.startsWith(today)).length
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("es-ES"),
      time: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const handleAreaAdded = (newArea: Area) => {
    setAreas((prev) => [...prev, newArea].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const getMovementIcon = (type: "entrada" | "salida") => {
    return type === "entrada" ? (
      <ArrowDown className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUp className="h-4 w-4 text-red-600" />
    )
  }

  const handlePasswordSuccess = async () => {
    setShowPasswordModal(false)
    
    if (!pendingSubmission) return
    
    try {
      setSubmitting(true)

      // Insertar movimiento con información del dispositivo
      await insertMovementWithDeviceInfo(pendingSubmission)

      // Actualizar inventario (código existente para actualizar hielo y botellones)
      const hieloQty = pendingSubmission.hielo_quantity
      const botellonQty = pendingSubmission.botellon_quantity
      
      const hieloItem = inventory.find((item) => item.product === "hielo")
      const botellonItem = inventory.find((item) => item.product === "botellon")

      const updates = []

      if (hieloQty > 0 && hieloItem) {
        const newHieloQuantity = hieloItem.quantity + hieloQty
        updates.push(supabase.from("inventory").update({ quantity: newHieloQuantity }).eq("product", "hielo"))
      }

      if (botellonQty > 0 && botellonItem) {
        const newBotellonQuantity = botellonItem.quantity + botellonQty
        updates.push(supabase.from("inventory").update({ quantity: newBotellonQuantity }).eq("product", "botellon"))
      }

      // Ejecutar todas las actualizaciones
      const results = await Promise.all(updates)
      const errors = results.filter((result) => result.error)

      if (errors.length > 0) {
        throw new Error("Error al actualizar inventario")
      }

      // Recargar datos
      await loadData()

      // Limpiar formulario
      setFormData({
        type: "",
        area: "",
        hieloQuantity: "",
        botellonQuantity: "",
        imageUrl: "",
        notes: "",
      })

      setPendingSubmission(null)

      showValidationModal(
        "success",
        "Entrada Registrada",
        "La entrada se ha registrado correctamente con autorización",
        [
          `Hielo: ${hieloQty} bolsas`,
          `Botellones: ${botellonQty} unidades`,
        ].filter(Boolean),
      )
    } catch (error) {
      console.error("Error submitting entry:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la entrada",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPendingSubmission(null)
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error de Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{dbError}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Para solucionar este problema:</p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>
                  Ejecuta el script: <code className="bg-gray-100 px-1 rounded">scripts/01-create-tables.sql</code>
                </li>
                <li>
                  Ejecuta el script:{" "}
                  <code className="bg-gray-100 px-1 rounded">scripts/02-insert-initial-data.sql</code>
                </li>
                <li>Haz clic en "Reintentar" para cargar los datos</li>
              </ol>
            </div>
            <Button onClick={loadData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || initializingDb) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>{initializingDb ? "Inicializando base de datos..." : "Cargando datos..."}</span>
        </div>
      </div>
    )
  }

return (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <CompanyLogo />
        </div>
        <p className="text-gray-600">Gestión de hielo y botellones de agua por áreas</p>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Inventario Actual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hielo</CardTitle>
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-600" />
              {getInventoryByProduct("hielo") <= (inventory.find((i) => i.product === "hielo")?.min_stock || 0) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getInventoryByProduct("hielo")}</div>
            <p className="text-xs text-muted-foreground">bolsas en stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Botellones</CardTitle>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-600" />
              {getInventoryByProduct("botellon") <=
                (inventory.find((i) => i.product === "botellon")?.min_stock || 0) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{getInventoryByProduct("botellon")}</div>
            <p className="text-xs text-muted-foreground">unidades en stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <div className="flex items-center gap-1">
              <ArrowDown className="h-4 w-4 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getTotalMovements("entrada")}</div>
            <p className="text-xs text-muted-foreground">movimientos hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salidas</CardTitle>
            <div className="flex items-center gap-1">
              <ArrowUp className="h-4 w-4 text-red-600" />
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getTotalMovements("salida")}</div>
            <p className="text-xs text-muted-foreground">movimientos hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para operaciones */}
      <Tabs defaultValue="registro" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registro">Registrar Movimiento</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Nuevo Movimiento
              </CardTitle>
              <CardDescription>
                Registra entradas y salidas de productos. Puedes incluir hielo, botellones o ambos en el mismo
                movimiento. La fotografía es obligatoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Movimiento</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, type: value, area: value === "entrada" ? "1" : "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="h-4 w-4 text-green-600" />
                            Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="salida">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4 text-red-600" />
                            Salida
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "salida" && (
                    <AreaSelector
                      areas={areas}
                      selectedArea={formData.area}
                      onAreaChange={(areaId) => setFormData((prev) => ({ ...prev, area: areaId }))}
                      onAreaAdded={handleAreaAdded}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hieloQuantity" className="flex items-center gap-2">
                      <Snowflake className="h-4 w-4 text-blue-600" />
                      Cantidad de Hielo (Máx. 50)
                    </Label>
                    <Input
                      id="hieloQuantity"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="0"
                      value={formData.hieloQuantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hieloQuantity: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botellonQuantity" className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-600" />
                      Cantidad de Botellones (Máx. 50)
                    </Label>
                    <Input
                      id="botellonQuantity"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="0"
                      value={formData.botellonQuantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, botellonQuantity: e.target.value }))}
                    />
                  </div>
                </div>

                <ImageUpload
                  onImageUploaded={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                  currentImage={formData.imageUrl}
                  required={true}
                />

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones adicionales..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Movimiento"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Historial de Movimientos
              </CardTitle>
              <CardDescription>Registro completo de entradas y salidas por área con fotografías</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Hielo</TableHead>
                      <TableHead>Botellones</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Fotografía</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No hay movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => {
                        const { date, time } = formatDateTime(movement.created_at)
                        return (
                          <TableRow key={movement.id}>
                            <TableCell>{date}</TableCell>
                            <TableCell>{time}</TableCell>
                            <TableCell>
                              <Badge
                                variant={movement.type === "entrada" ? "default" : "destructive"}
                                className={
                                  movement.type === "entrada"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                <div className="flex items-center gap-1">
                                  {getMovementIcon(movement.type)}
                                  {movement.type === "entrada" ? "Entrada" : "Salida"}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                {movement.areas?.name || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {movement.hielo_quantity > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Snowflake className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{movement.hielo_quantity}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {movement.botellon_quantity > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Droplets className="h-4 w-4 text-cyan-600" />
                                  <span className="font-medium">{movement.botellon_quantity}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-600 max-w-24 truncate">
                                  {movement.device_info?.browser || 'Desconocido'} - {movement.device_info?.os_name || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ImageViewer
                                imageUrl={movement.image_url}
                                alt={`Movimiento ${movement.type} - ${movement.areas?.name}`}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-32 truncate">
                              {movement.notes || "-"}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <Reports movements={movements} areas={areas} />
        </TabsContent>
      </Tabs>

      {/* Modal de alerta de stock bajo */}
      <StockAlertModal
        isOpen={showStockAlert}
        onClose={() => setShowStockAlert(false)}
        lowStockItems={lowStockItems}
      />

      {/* Modal de validación */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal((prev) => ({ ...prev, isOpen: false }))}
        type={validationModal.type}
        title={validationModal.title}
        message={validationModal.message}
        details={validationModal.details}
      />

      {/* Modal de contraseña */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  </div>
)
}
