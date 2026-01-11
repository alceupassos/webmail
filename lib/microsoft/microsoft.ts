import { ConfidentialClientApplication } from "@azure/msal-node";

const MICROSOFT_CONFIG = {
    clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    redirectUri: process.env.MICROSOFT_REDIRECT_URI ?? "http://localhost:7000/api/auth/microsoft/callback",
    authority: "https://login.microsoftonline.com/common",
    scopes: ["https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Mail.ReadWrite", "offline_access"],
};

export interface MicrosoftMessageSummary {
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    isRead: boolean;
}

export interface MicrosoftMessageDetail extends MicrosoftMessageSummary {
    body: string;
    to: string;
}

function getMsalClient(): ConfidentialClientApplication {
    if (!MICROSOFT_CONFIG.clientId || !MICROSOFT_CONFIG.clientSecret) {
        throw new Error("Microsoft OAuth credentials not configured");
    }

    return new ConfidentialClientApplication({
        auth: {
            clientId: MICROSOFT_CONFIG.clientId,
            clientSecret: MICROSOFT_CONFIG.clientSecret,
            authority: MICROSOFT_CONFIG.authority,
        },
    });
}

/**
 * Get the authorization URL for Microsoft OAuth
 */
export async function getAuthorizationUrl(state?: string): Promise<string> {
    const msalClient = getMsalClient();

    const authCodeUrlParameters = {
        scopes: MICROSOFT_CONFIG.scopes,
        redirectUri: MICROSOFT_CONFIG.redirectUri,
        state: state ?? "",
    };

    return await msalClient.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string | undefined;
    expiresOn: Date | null;
}> {
    const msalClient = getMsalClient();

    const tokenRequest = {
        code,
        scopes: MICROSOFT_CONFIG.scopes,
        redirectUri: MICROSOFT_CONFIG.redirectUri,
    };

    const response = await msalClient.acquireTokenByCode(tokenRequest);

    return {
        accessToken: response.accessToken,
        refreshToken: (response as { refreshToken?: string }).refreshToken,
        expiresOn: response.expiresOn,
    };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresOn: Date | null;
}> {
    const msalClient = getMsalClient();

    const refreshTokenRequest = {
        refreshToken,
        scopes: MICROSOFT_CONFIG.scopes,
    };

    const response = await msalClient.acquireTokenByRefreshToken(refreshTokenRequest);

    return {
        accessToken: response?.accessToken ?? "",
        expiresOn: response?.expiresOn ?? null,
    };
}

/**
 * List inbox messages using Microsoft Graph API
 */
export async function listInboxMessages(
    accessToken: string,
    options?: { maxResults?: number }
): Promise<MicrosoftMessageSummary[]> {
    const maxResults = options?.maxResults ?? 25;

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message ?? "Failed to fetch messages");
    }

    const data = await response.json();

    return data.value.map((msg: Record<string, unknown>) => ({
        id: msg.id as string,
        subject: (msg.subject as string) ?? "(no subject)",
        from: (msg.from as { emailAddress?: { name?: string; address?: string } })?.emailAddress?.name ??
            (msg.from as { emailAddress?: { address?: string } })?.emailAddress?.address ??
            "Unknown",
        date: msg.receivedDateTime as string,
        snippet: (msg.bodyPreview as string) ?? "",
        isRead: msg.isRead as boolean,
    }));
}

/**
 * Get message detail by ID
 */
export async function getMessageDetail(
    accessToken: string,
    messageId: string
): Promise<MicrosoftMessageDetail> {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,isRead`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message ?? "Failed to fetch message");
    }

    const msg = await response.json();

    // Extract plain text from HTML body
    let body = msg.bodyPreview ?? "";
    if (msg.body?.contentType === "text") {
        body = msg.body.content;
    } else if (msg.body?.contentType === "html") {
        // Strip HTML tags
        body = msg.body.content
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    const toRecipients = msg.toRecipients ?? [];
    const toAddresses = toRecipients
        .map((r: { emailAddress?: { name?: string; address?: string } }) =>
            r.emailAddress?.name ?? r.emailAddress?.address ?? ""
        )
        .filter(Boolean)
        .join(", ");

    return {
        id: msg.id,
        subject: msg.subject ?? "(no subject)",
        from: msg.from?.emailAddress?.name ?? msg.from?.emailAddress?.address ?? "Unknown",
        to: toAddresses,
        date: msg.receivedDateTime,
        snippet: msg.bodyPreview ?? "",
        body,
        isRead: msg.isRead,
    };
}

/**
 * Test if access token is valid
 */
export async function testAccessToken(accessToken: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error?.message ?? "Invalid token" };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
    }
}
