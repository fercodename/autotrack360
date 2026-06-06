-- =============================================
-- MIGRACIÓN 016: Nivel de verificación "O" (Oficial)
-- Agrega un nuevo nivel de verificación para eventos
-- importados desde fuentes gubernamentales verificadas
-- (ej: Registro Provincial de VTV, DNRPA, etc.)
-- Peso en scoring: 0.85 (entre B=0.7 y A=1.0)
-- =============================================

ALTER TYPE verification_level ADD VALUE IF NOT EXISTS 'O';

COMMENT ON TYPE verification_level IS
  'A=Taller verificado (1.0) | B=Con evidencia (0.7) | C=Declarativo (0.3) | O=Fuente oficial (0.85)';
