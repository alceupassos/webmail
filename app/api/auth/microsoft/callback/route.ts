import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/microsoft/microsoft";
import { createEmailAccount } from "@/lib/email-accounts";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
        const message = errorDescription ?? error;
        return NextResponse.redirect(
            new URL(`/webmail/config?error=${encodeURIComponent(message)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/webmail/config?error=missing_code", request.url)
        );
    }

    try {
        // Exchange code for tokens
        const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

        if (!refreshToken) {
            return NextResponse.redirect(
                new URL("/webmail/config?error=no_refresh_token", request.url)
            );
        }

        // Get user email from Microsoft Graph
        const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userInfoResponse.ok) {
            return NextResponse.redirect(
                new URL("/webmail/config?error=failed_to_get_user_info", request.url)
            );
        }

        const userInfo = await userInfoResponse.json();
        const email = userInfo.mail ?? userInfo.userPrincipalName;

        if (!email) {
            return NextResponse.redirect(
                new URL("/webmail/config?error=no_email", request.url)
            );
        }

        // Save the account to database
        await createEmailAccount({
            provider: "microsoft",
            email,
            label: email,
            oauth_refresh_token: refreshToken,
            is_primary: false,
        });

        // Redirect back to config page with success
        return NextResponse.redirect(
            new URL(`/webmail/config?success=microsoft&email=${encodeURIComponent(email)}`, request.url)
        );
    } catch (err) {
        console.error("Microsoft OAuth error:", err);
        return NextResponse.redirect(
            new URL(`/webmail/config?error=oauth_failed`, request.url)
        );
    }
}
