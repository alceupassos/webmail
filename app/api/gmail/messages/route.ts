import { NextResponse } from "next/server";

import { listInboxMessages } from "@/lib/google/gmail";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maxParam = Number(searchParams.get("max") ?? "20");
    const maxResults = Number.isFinite(maxParam)
      ? Math.min(Math.max(maxParam, 1), 50)
      : 20;

    const messages = await listInboxMessages({ maxResults });
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
