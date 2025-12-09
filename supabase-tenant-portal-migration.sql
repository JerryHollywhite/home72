-- Home72 Tenant Portal & Telegram Bot Schema Updates

-- Add telegram_chat_id to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE;

-- Add QRIS and payment method fields to payments table
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS qris_url TEXT,
  ADD COLUMN IF NOT EXISTS qris_expired_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';

-- Add check constraint for payment_method
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_payment_method_check'
  ) THEN
    ALTER TABLE payments 
      ADD CONSTRAINT payments_payment_method_check 
      CHECK (payment_method IN ('transfer', 'qris', 'cash'));
  END IF;
END $$;

-- Create telegram_sessions table for bot state management
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  room_number TEXT,
  state TEXT DEFAULT 'idle',
  temp_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on chat_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_chat_id ON telegram_sessions(chat_id);

-- Add updated_at trigger for telegram_sessions
CREATE OR REPLACE FUNCTION update_telegram_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_telegram_sessions_updated_at
  BEFORE UPDATE ON telegram_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_sessions_updated_at();

-- RLS policies for telegram_sessions
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage telegram sessions"
  ON telegram_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own session
CREATE POLICY "Users can read their own telegram session"
  ON telegram_sessions
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE email = auth.email()
  ));

-- Update RLS for tenants to allow telegram access
-- CREATE POLICY "Tenants can view own data via room number"
--   ON tenants
--   FOR SELECT
--   TO anon
--   USING (room_number IS NOT NULL);

COMMENT ON TABLE telegram_sessions IS 'Stores Telegram bot conversation state for tenants';
COMMENT ON COLUMN tenants.telegram_chat_id IS 'Telegram chat ID for bot notifications';
COMMENT ON COLUMN payments.qris_url IS 'URL to QRIS payment QR code image';
COMMENT ON COLUMN payments.qris_expired_at IS 'QRIS expiration timestamp (typically 15 minutes)';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: transfer, qris, or cash';
