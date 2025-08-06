-- Crear tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(50) NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de movimientos
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida')),
  product VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales de inventario
INSERT INTO inventory (product, quantity, min_stock) 
VALUES 
  ('hielo', 50, 15),
  ('botellon', 25, 10)
ON CONFLICT (product) DO NOTHING;

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
