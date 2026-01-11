import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createEmailAccount } from "@/lib/email-accounts";
import { getOAuthCredentials } from "@/lib/oauth-credentials";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(
            new URL(`/webmail/config?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/webmail/config?error=missing_code", request.url)
        );
    }

    const credentials = await getOAuthCredentials('google');

    if (!credentials) {
        return NextResponse.redirect(
            new URL("/webmail/config?error=oauth_not_configured_in_database", request.url)
        );
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret,
            credentials.redirectUri
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return NextResponse.redirect(
                new URL("/webmail/config?error=no_refresh_token", request.url)
            );
        }

        // Set credentials to get user info
        oauth2Client.setCredentials(tokens);

        // Get user email
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        if (!email) {
            return NextResponse.redirect(
                new URL("/webmail/config?error=no_email", request.url)
            );
        }

        // Save the account to database
        await createEmailAccount({
            provider: "gmail",
            email,
            label: email,
            oauth_refresh_token: tokens.refresh_token,
            is_primary: true,
        });

        // Redirect back to config page with success
        return NextResponse.redirect(
            new URL(`/webmail/config?success=gmail&email=${encodeURIComponent(email)}`, request.url)
        );
    } catch (err) {
        console.error("Gmail OAuth error:", err);
        return NextResponse.redirect(
            new URL(`/webmail/config?error=oauth_failed`, request.url)
        );
    }
}
