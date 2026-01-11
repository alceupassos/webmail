import { createClient } from "@/lib/supabase/server";

export interface OAuthCredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export async function getOAuthCredentials(provider: 'google' | 'microsoft'): Promise<OAuthCredentials | null> {
    // 1. Try to fetch from Supabase
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from("oauth_credentials")
                .select("client_id, client_secret, redirect_uri")
                .eq("user_id", user.id)
                .eq("provider", provider === 'google' ? 'google' : 'microsoft')
                .single();

            if (!error && data) {
                return {
                    clientId: data.client_id,
                    clientSecret: data.client_secret,
                    redirectUri: data.redirect_uri,
                };
            }
        }
    } catch (err) {
        console.error(`Error fetching ${provider} credentials from Supabase:`, err);
    }

    // 2. Fallback to process.env
    const clientId = provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = provider === 'google' ? process.env.GOOGLE_CLIENT_SECRET : process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = provider === 'google' ? process.env.GOOGLE_REDIRECT_URI : process.env.MICROSOFT_REDIRECT_URI;

    if (clientId && clientSecret && redirectUri) {
        return {
            clientId,
            clientSecret,
            redirectUri,
        };
    }

    return null;
}
