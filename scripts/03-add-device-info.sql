-- Agregar columnas para información del dispositivo
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Crear índice para búsquedas por dispositivo
CREATE INDEX IF NOT EXISTS idx_movements_device_info ON movements USING GIN (device_info);

-- Comentario para documentar la estructura del device_info
COMMENT ON COLUMN movements.device_info IS 'Información del dispositivo: {user_agent, platform, screen_resolution, timestamp, ip_hash}';
