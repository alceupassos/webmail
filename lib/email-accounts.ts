import { createClient } from "@/lib/supabase/server";
import type {
    EmailAccount,
    CreateEmailAccountInput,
    UpdateEmailAccountInput,
} from "@/lib/types/email-account";

/**
 * Get all email accounts for the current user
 */
export async function getEmailAccounts(): Promise<EmailAccount[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch email accounts: ${error.message}`);
    }

    return data as EmailAccount[];
}

/**
 * Get a specific email account by ID
 */
export async function getEmailAccount(id: string): Promise<EmailAccount | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null; // Not found
        }
        throw new Error(`Failed to fetch email account: ${error.message}`);
    }

    return data as EmailAccount;
}

/**
 * Get the primary email account for the current user
 */
export async function getPrimaryEmailAccount(): Promise<EmailAccount | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .eq("is_active", true)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null; // Not found
        }
        throw new Error(`Failed to fetch primary email account: ${error.message}`);
    }

    return data as EmailAccount;
}

/**
 * Create a new email account
 */
export async function createEmailAccount(
    input: CreateEmailAccountInput
): Promise<EmailAccount> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    // Encrypt IMAP password if provided
    let imap_password_encrypted = null;
    if (input.imap_password) {
        // TODO: Implement proper encryption
        // For now, we'll use base64 encoding (NOT SECURE - replace with proper encryption)
        imap_password_encrypted = Buffer.from(input.imap_password).toString("base64");
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .insert({
            user_id: user.id,
            provider: input.provider,
            email: input.email,
            label: input.label,
            is_primary: input.is_primary ?? false,
            oauth_refresh_token: input.oauth_refresh_token,
            imap_host: input.imap_host,
            imap_port: input.imap_port,
            imap_username: input.imap_username,
            imap_password_encrypted,
            imap_use_tls: input.imap_use_tls ?? true,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create email account: ${error.message}`);
    }

    return data as EmailAccount;
}

/**
 * Update an email account
 */
export async function updateEmailAccount(
    id: string,
    input: UpdateEmailAccountInput
): Promise<EmailAccount> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .update(input)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update email account: ${error.message}`);
    }

    return data as EmailAccount;
}

/**
 * Delete an email account
 */
export async function deleteEmailAccount(id: string): Promise<void> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(`Failed to delete email account: ${error.message}`);
    }
}

/**
 * Update sync status for an email account
 */
export async function updateSyncStatus(
    id: string,
    status: "pending" | "syncing" | "success" | "error",
    error?: string
): Promise<void> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { error: updateError } = await supabase
        .from("email_accounts")
        .update({
            sync_status: status,
            sync_error: error ?? null,
            last_sync_at: status === "success" ? new Date().toISOString() : undefined,
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (updateError) {
        throw new Error(`Failed to update sync status: ${updateError.message}`);
    }
}
