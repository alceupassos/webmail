import { NextResponse } from "next/server";

import { getMessageDetail } from "@/lib/google/gmail";

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

    const message = await getMessageDetail(id);
    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
