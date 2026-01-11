import { NextResponse } from "next/server";
import { getMessageDetail } from "@/lib/google/gmail";
import { getPrimaryEmailAccount } from "@/lib/email-accounts";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Message id is required" },
        { status: 400 },
      );
    }

    let credentials;
    // If not in env, try database
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      const primaryAccount = await getPrimaryEmailAccount();
      if (primaryAccount && primaryAccount.provider === "gmail" && primaryAccount.oauth_refresh_token) {
        credentials = { refresh_token: primaryAccount.oauth_refresh_token };
      }
    }

    const message = await getMessageDetail(id, credentials);
    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
