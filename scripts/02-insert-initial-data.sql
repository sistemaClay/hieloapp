-- Insertar áreas predefinidas
INSERT INTO areas (name) 
VALUES 
  ('Administrativa'),
  ('Horno'),
  ('Producción'),
  ('Mantenimiento Eléctrico'),
  ('Mantenimiento General'),
  ('Mantenimiento Automotriz')
ON CONFLICT (name) DO NOTHING;

-- Insertar datos iniciales de inventario
INSERT INTO inventory (product, quantity, min_stock) 
VALUES 
  ('hielo', 50, 15),
  ('botellon', 25, 10)
ON CONFLICT (product) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  min_stock = EXCLUDED.min_stock;

-- Insertar algunos movimientos de ejemplo (con URLs de imagen placeholder)
INSERT INTO movements (type, area_id, hielo_quantity, botellon_quantity, image_url, notes) 
VALUES 
  ('entrada', 1, 30, 0, '/placeholder.svg?height=200&width=300', 'Entrada de hielo - Stock inicial'),
  ('entrada', 1, 0, 20, '/placeholder.svg?height=200&width=300', 'Entrada de botellones - Stock inicial'),
  ('salida', 2, 5, 2, '/placeholder.svg?height=200&width=300', 'Suministro para área de horno'),
  ('salida', 3, 10, 3, '/placeholder.svg?height=200&width=300', 'Suministro para producción');
