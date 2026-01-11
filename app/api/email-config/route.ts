import { NextResponse } from "next/server";
import {
    getEmailAccounts,
    createEmailAccount,
} from "@/lib/email-accounts";
import type { CreateEmailAccountInput } from "@/lib/types/email-account";

export async function GET() {
    try {
        const accounts = await getEmailAccounts();
        return NextResponse.json({ accounts });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const input: CreateEmailAccountInput = body;

        // Validate required fields
        if (!input.provider || !input.email) {
            return NextResponse.json(
                { error: "Provider and email are required" },
                { status: 400 }
            );
        }

        // Validate provider-specific requirements
        if (input.provider === "gmail" && !input.oauth_refresh_token) {
            return NextResponse.json(
                { error: "OAuth refresh token is required for Gmail" },
                { status: 400 }
            );
        }

        if (input.provider === "microsoft" && !input.oauth_refresh_token) {
            return NextResponse.json(
                { error: "OAuth refresh token is required for Microsoft" },
                { status: 400 }
            );
        }

        if (input.provider === "imap") {
            if (!input.imap_host || !input.imap_username || !input.imap_password) {
                return NextResponse.json(
                    { error: "IMAP host, username, and password are required" },
                    { status: 400 }
                );
            }
        }

        const account = await createEmailAccount(input);
        return NextResponse.json({ account }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create account" },
            { status: 500 }
        );
    }
}
