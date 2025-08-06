import { createClient } from "@supabase/supabase-js"
import { getDeviceInfo, type DeviceInfo } from './device-info'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface InventoryItem {
  id: number
  product: string
  quantity: number
  min_stock: number
  updated_at: string
}

export interface Area {
  id: number
  name: string
  created_at: string
}

export interface Movement {
  id: string
  type: "entrada" | "salida"
  area_id: number
  hielo_quantity: number
  botellon_quantity: number
  image_url: string
  notes?: string
  device_info?: DeviceInfo
  created_at: string
  areas?: Area
}

// Función para verificar si las tablas existen
export async function checkTablesExist() {
  try {
    const { data, error } = await supabase.from("inventory").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Tables check error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Función para inicializar datos por defecto si las tablas están vacías
export async function initializeDefaultData() {
  try {
    // Verificar si ya hay datos en inventory
    const { data: existingInventory, error: inventoryError } = await supabase.from("inventory").select("*")

    if (inventoryError) throw inventoryError

    // Si no hay datos, insertar datos por defecto
    if (!existingInventory || existingInventory.length === 0) {
      const { error: insertError } = await supabase.from("inventory").insert([
        { product: "hielo", quantity: 50, min_stock: 15 },
        { product: "botellon", quantity: 25, min_stock: 10 },
      ])

      if (insertError) throw insertError
    }

    // Verificar áreas
    const { data: existingAreas, error: areasError } = await supabase.from("areas").select("*")

    if (areasError) throw areasError

    if (!existingAreas || existingAreas.length === 0) {
      const { error: areasInsertError } = await supabase
        .from("areas")
        .insert([
          { name: "Administrativa" },
          { name: "Horno" },
          { name: "Producción" },
          { name: "Mantenimiento Eléctrico" },
          { name: "Mantenimiento General" },
          { name: "Mantenimiento Automotriz" },
        ])

      if (areasInsertError) throw areasInsertError
    }

    return true
  } catch (error) {
    console.error("Error initializing default data:", error)
    return false
  }
}

// Función para agregar nueva área
export async function addNewArea(areaName: string) {
  try {
    const { data, error } = await supabase.from("areas").insert({ name: areaName }).select().single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error adding new area:", error)
    throw error
  }
}

// Función para subir imagen a Vercel Blob
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Error al subir la imagen")
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Función para insertar movimientos con información del dispositivo
export async function insertMovementWithDeviceInfo(movementData: {
  type: "entrada" | "salida"
  area_id: number
  hielo_quantity: number
  botellon_quantity: number
  image_url: string
  notes?: string
}) {
  try {
    // Capturar información básica del dispositivo
    const deviceInfo = getDeviceInfo()
    
    console.log('Device info captured:', deviceInfo) // Para debug
    
    const { data, error } = await supabase
      .from("movements")
      .insert({
        ...movementData,
        device_info: deviceInfo
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    console.log('Movement inserted successfully:', data) // Para debug
    return data
  } catch (error) {
    console.error("Error inserting movement with device info:", error)
    throw error
  }
}
