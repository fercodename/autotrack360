-- ============================================================
-- Diagnóstico: reporte público y evidencias
-- Ejecutar en Supabase → SQL Editor. Reemplazá 'TU_TOKEN_AQUI' por el token real de la URL del reporte.
-- ============================================================

-- 1) Reporte QR: ver si existe y qué vehiculo_id tiene
-- Reemplazá TU_TOKEN_AQUI por el token de la URL del reporte (ej: .../reporte/abc123 → token = 'abc123')
SELECT id, token, vehiculo_id, is_revoked, expires_at, view_count
FROM reportes_qr
WHERE token = 'TU_TOKEN_AQUI';

-- Si no hay filas: el token no existe o está mal copiado.
-- Si hay una fila: copiá el vehiculo_id y usalo en la query 2.

-- 2) Eventos de ESE vehículo (usar el vehiculo_id que salió en la query 1)
-- Primero SIN filtrar ocultos/aprobación, para ver si hay eventos en la BD
SELECT e.id AS evento_id, e.titulo, e.is_hidden, e.approval_status, e.verification_level, e.fecha_evento
FROM eventos e
WHERE e.vehiculo_id = 'TU_VEHICULO_ID_AQUI'
ORDER BY e.fecha_evento DESC;

-- Si esta query da 0 filas: ese vehículo no tiene eventos. Comprobá que vehiculo_id sea el de la query 1.
-- Si da filas: los eventos existen; puede que is_hidden = true o approval_status != 'aprobado' y por eso no salen en el reporte.

-- 2b) Eventos que SÍ muestra el reporte (aprobados, no ocultos), usando el token
SELECT e.id AS evento_id, e.titulo, e.is_hidden, e.approval_status, e.verification_level
FROM reportes_qr r
JOIN eventos e ON e.vehiculo_id = r.vehiculo_id
WHERE r.token = 'TU_TOKEN_AQUI'
  AND r.is_revoked = false
  AND r.expires_at > NOW()
  AND (e.is_hidden IS NULL OR e.is_hidden = false)
  AND (e.approval_status = 'aprobado' OR e.approval_status IS NULL)
ORDER BY e.fecha_evento DESC;

-- 3) Evidencias ligadas a esos eventos (reemplazá TU_TOKEN_AQUI)
SELECT ev.id AS evidencia_id, ev.evento_id, ev.file_name, ev.file_type, ev.created_at
FROM reportes_qr r
JOIN eventos e ON e.vehiculo_id = r.vehiculo_id
JOIN evidencias ev ON ev.evento_id = e.id
WHERE r.token = 'TU_TOKEN_AQUI'
  AND r.is_revoked = false
  AND r.expires_at > NOW()
  AND (e.is_hidden IS NULL OR e.is_hidden = false)
  AND (e.approval_status = 'aprobado' OR e.approval_status IS NULL)
ORDER BY e.fecha_evento DESC, ev.created_at;

-- Si la query 3 devuelve filas, los datos en la BD están bien y el fallo está en la app.
-- Si la query 3 no devuelve filas, revisá:
--   - Que existan filas en evidencias con evento_id = algun id de la query 2.
--   - Que esos evento_id coincidan exactamente con los id de eventos (UUID).

-- 4) Listar TODAS las evidencias del proyecto (para ver evento_id y comparar con query 2)
SELECT ev.id, ev.evento_id, ev.file_name, ev.created_at
FROM evidencias ev
ORDER BY ev.created_at DESC
LIMIT 20;
