-- Migration: Email Alerts
-- Description: Store alerts generated from emails for mobile push notifications

CREATE TABLE IF NOT EXISTS email_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    
    -- Email identification in provider
    email_id TEXT NOT NULL,
    
    -- Alert details
    type TEXT NOT NULL CHECK (type IN ('urgent', 'important', 'newsletter', 'social', 'promo')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    title TEXT NOT NULL,
    preview TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT false,
    pushed_to_mobile BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_alerts_user_id ON email_alerts(user_id);
CREATE INDEX idx_email_alerts_created_at ON email_alerts(created_at DESC);
CREATE INDEX idx_email_alerts_read ON email_alerts(read) WHERE read = false;

-- RLS
ALTER TABLE email_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON email_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON email_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON email_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON email_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_email_alerts_updated_at
  BEFORE UPDATE ON email_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
