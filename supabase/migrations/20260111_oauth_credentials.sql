-- Migration: OAuth Credentials
-- Description: Store OAuth credentials per user to allow dynamic configuration via UI

CREATE TABLE IF NOT EXISTS oauth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- RLS
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oauth_credentials"
  ON oauth_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth_credentials"
  ON oauth_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth_credentials"
  ON oauth_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth_credentials"
  ON oauth_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_oauth_credentials_updated_at
  BEFORE UPDATE ON oauth_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
