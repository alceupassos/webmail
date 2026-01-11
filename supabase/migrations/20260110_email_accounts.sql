-- Migration: Email Accounts Configuration
-- Description: Store email account configurations for multi-provider support

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account identification
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'microsoft', 'imap')),
  email TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  
  -- OAuth credentials (for Gmail and Microsoft)
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_token_expiry TIMESTAMPTZ,
  
  -- IMAP credentials (encrypted)
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password_encrypted TEXT,
  imap_use_tls BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  
  -- Constraints
  UNIQUE(user_id, email),
  CHECK (
    (provider = 'gmail' AND oauth_refresh_token IS NOT NULL) OR
    (provider = 'microsoft' AND oauth_refresh_token IS NOT NULL) OR
    (provider = 'imap' AND imap_host IS NOT NULL AND imap_password_encrypted IS NOT NULL)
  )
);

-- Create index for faster lookups
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_provider ON email_accounts(provider);
CREATE INDEX idx_email_accounts_active ON email_accounts(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own email accounts
CREATE POLICY "Users can view own email accounts"
  ON email_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own email accounts
CREATE POLICY "Users can insert own email accounts"
  ON email_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own email accounts
CREATE POLICY "Users can update own email accounts"
  ON email_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own email accounts
CREATE POLICY "Users can delete own email accounts"
  ON email_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure only one primary account per user
CREATE OR REPLACE FUNCTION ensure_single_primary_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE email_accounts
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_account_trigger
  BEFORE INSERT OR UPDATE ON email_accounts
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_account();
