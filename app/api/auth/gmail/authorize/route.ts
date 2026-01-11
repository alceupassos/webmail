import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthCredentials } from "@/lib/oauth-credentials";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") ?? "";

    const credentials = await getOAuthCredentials('google');

    if (!credentials) {
        return NextResponse.json(
            { error: "Google OAuth credentials not configured. Please set them in config." },
            { status: 400 }
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        credentials.redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        state,
        prompt: "consent", // Force to get refresh token
    });

    return NextResponse.redirect(authUrl);
}
