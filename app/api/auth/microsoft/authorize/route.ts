import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/microsoft/microsoft";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") ?? "";

    try {
        const authUrl = await getAuthorizationUrl(state);
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("Microsoft OAuth error:", error);
        return NextResponse.redirect(
            new URL("/webmail/config?error=microsoft_oauth_failed", request.url)
        );
    }
}
