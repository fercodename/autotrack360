-- API keys para integraciones externas (bots, apps mobile, webhooks)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,                          -- SHA-256 del API key (nunca se guarda el key en texto plano)
  key_prefix VARCHAR(8) NOT NULL,                  -- Primeros 8 chars para identificación visual (ej: "at360_ab")
  label TEXT NOT NULL DEFAULT 'API Key',           -- Nombre descriptivo
  permissions TEXT[] NOT NULL DEFAULT '{read}',     -- read, write, admin
  telegram_chat_id TEXT,                           -- Para vincular bot de Telegram
  whatsapp_phone TEXT,                             -- Para vincular WhatsApp Business
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_telegram ON user_api_keys(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- RLS: cada usuario solo ve y gestiona sus propias keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own api keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);
