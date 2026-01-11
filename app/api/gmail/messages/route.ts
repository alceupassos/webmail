import { NextResponse } from "next/server";
import { listInboxMessages } from "@/lib/google/gmail";
import { getPrimaryEmailAccount } from "@/lib/email-accounts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maxParam = Number(searchParams.get("max") ?? "20");
    const maxResults = Number.isFinite(maxParam)
      ? Math.min(Math.max(maxParam, 1), 50)
      : 20;

    let credentials;
    // If not in env, try database
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      const primaryAccount = await getPrimaryEmailAccount();
      if (primaryAccount && primaryAccount.provider === "gmail" && primaryAccount.oauth_refresh_token) {
        credentials = { refresh_token: primaryAccount.oauth_refresh_token };
      }
    }

    const messages = await listInboxMessages({ maxResults, credentials });
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
