-- Eliminar tablas existentes si existen (para desarrollo)
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS areas CASCADE;

-- Crear tabla de áreas
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de inventario
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(50) NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de movimientos (modificada para incluir imagen)
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida')),
  area_id INTEGER REFERENCES areas(id),
  hielo_quantity INTEGER DEFAULT 0,
  botellon_quantity INTEGER DEFAULT 0,
  image_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_at_least_one_product CHECK (hielo_quantity > 0 OR botellon_quantity > 0)
);

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
