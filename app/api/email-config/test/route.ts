import { NextResponse } from "next/server";
import type { TestConnectionInput } from "@/lib/types/email-account";
import { testConnection as testImapConnection } from "@/lib/imap/imap";
import { testAccessToken as testMicrosoftToken } from "@/lib/microsoft/microsoft";

export async function POST(request: Request) {
    try {
        const body: TestConnectionInput = await request.json();

        if (body.provider === "imap") {
            // Test IMAP connection
            if (!body.imap_host || !body.imap_username || !body.imap_password) {
                return NextResponse.json(
                    { success: false, error: "Missing IMAP credentials" },
                    { status: 400 }
                );
            }

            const result = await testImapConnection({
                host: body.imap_host,
                port: body.imap_port ?? 993,
                user: body.imap_username,
                password: body.imap_password,
                tls: body.imap_use_tls ?? true,
            });

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    message: "IMAP connection successful",
                });
            } else {
                return NextResponse.json(
                    { success: false, error: result.error ?? "Connection failed" },
                    { status: 400 }
                );
            }
        }

        if (body.provider === "microsoft") {
            if (!body.oauth_access_token) {
                return NextResponse.json(
                    { success: false, error: "Missing OAuth access token" },
                    { status: 400 }
                );
            }

            const result = await testMicrosoftToken(body.oauth_access_token);

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    message: "Microsoft token is valid",
                });
            } else {
                return NextResponse.json(
                    { success: false, error: result.error ?? "Token validation failed" },
                    { status: 400 }
                );
            }
        }

        if (body.provider === "gmail") {
            // Gmail uses existing OAuth flow
            if (!body.oauth_access_token) {
                return NextResponse.json(
                    { success: false, error: "Missing OAuth access token" },
                    { status: 400 }
                );
            }

            // Test Gmail token by calling userinfo endpoint
            const response = await fetch(
                "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
                {
                    headers: {
                        Authorization: `Bearer ${body.oauth_access_token}`,
                    },
                }
            );

            if (response.ok) {
                return NextResponse.json({
                    success: true,
                    message: "Gmail token is valid",
                });
            } else {
                return NextResponse.json(
                    { success: false, error: "Invalid Gmail token" },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: "Invalid provider" },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Connection test failed",
            },
            { status: 500 }
        );
    }
}
