import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") ?? "";

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
            { error: "Google OAuth credentials not configured" },
            { status: 500 }
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
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
