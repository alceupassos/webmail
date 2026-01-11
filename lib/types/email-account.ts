export type EmailProvider = 'gmail' | 'microsoft' | 'imap';

export type EmailAccountStatus = 'pending' | 'syncing' | 'success' | 'error';

export interface EmailAccount {
    id: string;
    user_id: string;
    provider: EmailProvider;
    email: string;
    label: string;
    is_active: boolean;
    is_primary: boolean;

    // OAuth credentials (for Gmail and Microsoft)
    oauth_access_token?: string | null;
    oauth_refresh_token?: string | null;
    oauth_token_expiry?: string | null;

    // IMAP credentials
    imap_host?: string | null;
    imap_port?: number | null;
    imap_username?: string | null;
    imap_password_encrypted?: string | null;
    imap_use_tls?: boolean | null;

    // Metadata
    created_at: string;
    updated_at: string;
    last_sync_at?: string | null;
    sync_status: EmailAccountStatus;
    sync_error?: string | null;
}

export interface CreateEmailAccountInput {
    provider: EmailProvider;
    email: string;
    label: string;
    is_primary?: boolean;

    // OAuth credentials (for Gmail and Microsoft)
    oauth_refresh_token?: string;

    // IMAP credentials
    imap_host?: string;
    imap_port?: number;
    imap_username?: string;
    imap_password?: string; // Will be encrypted server-side
    imap_use_tls?: boolean;
}

export interface UpdateEmailAccountInput {
    label?: string;
    is_active?: boolean;
    is_primary?: boolean;
}

export interface TestConnectionInput {
    provider: EmailProvider;

    // OAuth test
    oauth_access_token?: string;

    // IMAP test
    imap_host?: string;
    imap_port?: number;
    imap_username?: string;
    imap_password?: string;
    imap_use_tls?: boolean;
}

export interface TestConnectionResult {
    success: boolean;
    error?: string;
    message?: string;
}
