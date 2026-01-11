import { NextResponse } from "next/server";
import {
    getEmailAccount,
    updateEmailAccount,
    deleteEmailAccount,
} from "@/lib/email-accounts";
import type { UpdateEmailAccountInput } from "@/lib/types/email-account";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const account = await getEmailAccount(id);

        if (!account) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ account });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch account" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const input: UpdateEmailAccountInput = body;

        const account = await updateEmailAccount(id, input);
        return NextResponse.json({ account });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update account" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteEmailAccount(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete account" },
            { status: 500 }
        );
    }
}
