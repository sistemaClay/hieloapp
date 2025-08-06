"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { CalendarDays, BarChart3, Download, Filter, Snowflake, Droplets, TrendingUp, MapPin } from 'lucide-react'
import type { Movement, Area } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ReportsProps {
  movements: Movement[]
  areas: Area[]
}

interface ConsumptionByArea {
  area: string
  hielo: number
  botellon: number
  total: number
}

interface EntryReport {
  date: string
  area: string
  hielo_quantity: number
  botellon_quantity: number
  notes: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function Reports({ movements, areas }: ReportsProps) {
  const [loading, setLoading] = useState(false)
  const [consumptionData, setConsumptionData] = useState<ConsumptionByArea[]>([])
  const [entryData, setEntryData] = useState<EntryReport[]>([])
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const { toast } = useToast()

  // Obtener fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    generateConsumptionReport()
  }, [movements, areas])

  const generateConsumptionReport = () => {
    const consumptionByArea: { [key: string]: ConsumptionByArea } = {}

    // Inicializar todas las áreas
    areas.forEach((area) => {
      consumptionByArea[area.name] = {
        area: area.name,
        hielo: 0,
        botellon: 0,
        total: 0,
      }
    })

    // Calcular consumos (solo salidas)
    movements
      .filter((m) => m.type === "salida")
      .forEach((movement) => {
        const areaName = movement.areas?.name || "Sin área"
        if (!consumptionByArea[areaName]) {
          consumptionByArea[areaName] = {
            area: areaName,
            hielo: 0,
            botellon: 0,
            total: 0,
          }
        }

        consumptionByArea[areaName].hielo += movement.hielo_quantity
        consumptionByArea[areaName].botellon += movement.botellon_quantity
        consumptionByArea[areaName].total += movement.hielo_quantity + movement.botellon_quantity
      })

    setConsumptionData(Object.values(consumptionByArea))
  }

  const generateEntryReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un rango de fechas",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const filteredMovements = movements
      .filter((m) => {
        const movementDate = new Date(m.created_at).toISOString().split("T")[0]
        const isInDateRange = movementDate >= dateRange.startDate && movementDate <= dateRange.endDate
        const isEntry = m.type === "entrada"

        return isInDateRange && isEntry
      })
      .map((movement) => ({
        date: new Date(movement.created_at).toLocaleDateString("es-ES"),
        area: movement.areas?.name || "Sin área",
        hielo_quantity: movement.hielo_quantity,
        botellon_quantity: movement.botellon_quantity,
        notes: movement.notes || "",
      }))

    setEntryData(filteredMovements)
    setLoading(false)

    if (filteredMovements.length === 0) {
      toast({
        title: "Sin resultados",
        description: "No se encontraron entradas en el rango de fechas seleccionado",
        variant: "destructive",
      })
    }
  }

  const exportReport = (type: "consumption" | "entries") => {
    // Aquí se podría implementar la exportación a Excel/PDF
    toast({
      title: "Exportando...",
      description: `Preparando reporte de ${type === "consumption" ? "consumos" : "entradas"}`,
    })
  }

  const getTotalConsumption = () => {
    return consumptionData.reduce(
      (acc, item) => ({
        hielo: acc.hielo + item.hielo,
        botellon: acc.botellon + item.botellon,
        total: acc.total + item.total,
      }),
      { hielo: 0, botellon: 0, total: 0 },
    )
  }

  const getTopConsumingAreas = () => {
    // Crear una copia del array antes de ordenar
    return [...consumptionData]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
      }))
  }

  // Función para procesar datos de línea de tiempo sin mutar el array original
  const getTimelineData = () => {
    const processedData: any[] = []
    
    entryData.forEach((entry) => {
      const existingDate = processedData.find((item) => item.date === entry.date)
      if (existingDate) {
        existingDate.hielo += entry.hielo_quantity
        existingDate.botellon += entry.botellon_quantity
      } else {
        processedData.push({
          date: entry.date,
          hielo: entry.hielo_quantity,
          botellon: entry.botellon_quantity,
        })
      }
    })
    
    return processedData
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Reportes y Análisis
        </h2>
        <p className="text-gray-600">Análisis detallado de consumos y entradas por área</p>
      </div>

      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consumption">Consumos por Área</TabsTrigger>
          <TabsTrigger value="entries">Entradas por Fecha</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-6">
          {/* Resumen de consumos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hielo Consumido</CardTitle>
                <Snowflake className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{getTotalConsumption().hielo}</div>
                <p className="text-xs text-muted-foreground">bolsas consumidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Botellones Consumidos</CardTitle>
                <Droplets className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{getTotalConsumption().botellon}</div>
                <p className="text-xs text-muted-foreground">unidades consumidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área con Mayor Consumo</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600">{getTopConsumingAreas()[0]?.area || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {getTopConsumingAreas()[0]?.total || 0} productos consumidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de barras - Consumo por área */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Consumo por Área
              </CardTitle>
              <CardDescription>Comparación de consumo de hielo y botellones por área</CardDescription>
              <div className="flex justify-end">
                <Button onClick={() => exportReport("consumption")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={consumptionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [value, name === "hielo" ? "Hielo (bolsas)" : "Botellones (unidades)"]}
                  />
                  <Legend />
                  <Bar dataKey="hielo" fill="#3B82F6" name="Hielo" />
                  <Bar dataKey="botellon" fill="#06B6D4" name="Botellones" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de pastel - Top 5 áreas */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Áreas por Consumo Total</CardTitle>
              <CardDescription>Distribución porcentual del consumo total</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={getTopConsumingAreas()}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="total"
                    label={false}
                  >
                    {getTopConsumingAreas().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} productos`,
                      `${props.payload.area} (${((Number(value) / getTotalConsumption().total) * 100).toFixed(1)}%)`,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${entry.payload.area}: ${entry.payload.total} productos`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          {/* Filtros para entradas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription>
                Selecciona el rango de fechas para generar el reporte de entradas (no se pueden seleccionar fechas futuras)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    max={today}
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    max={today}
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={generateEntryReport} disabled={loading} className="w-full">
                    {loading ? "Generando..." : "Generar Reporte"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de entradas */}
          {entryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Reporte de Entradas
                </CardTitle>
                <CardDescription>
                  Total de entradas registradas del {dateRange.startDate} al {dateRange.endDate}
                </CardDescription>
                <div className="flex justify-end">
                  <Button onClick={() => exportReport("entries")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Hielo</TableHead>
                        <TableHead>Botellones</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entryData.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{entry.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              {entry.area}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.hielo_quantity > 0 ? (
                              <div className="flex items-center gap-1">
                                <Snowflake className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{entry.hielo_quantity}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.botellon_quantity > 0 ? (
                              <div className="flex items-center gap-1">
                                <Droplets className="h-4 w-4 text-cyan-600" />
                                <span className="font-medium">{entry.botellon_quantity}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-48 truncate">
                            {entry.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Resumen del reporte */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Resumen del Período</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total de entradas:</span>
                      <span className="font-medium ml-2">{entryData.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hielo ingresado:</span>
                      <span className="font-medium ml-2 text-blue-600">
                        {entryData.reduce((sum, entry) => sum + entry.hielo_quantity, 0)} bolsas
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Botellones ingresados:</span>
                      <span className="font-medium ml-2 text-cyan-600">
                        {entryData.reduce((sum, entry) => sum + entry.botellon_quantity, 0)} unidades
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de líneas para entradas por fecha */}
          {entryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Entradas</CardTitle>
                <CardDescription>Evolución de las entradas a lo largo del tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={getTimelineData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hielo" stroke="#3B82F6" name="Hielo" strokeWidth={2} />
                    <Line type="monotone" dataKey="botellon" stroke="#06B6D4" name="Botellones" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
