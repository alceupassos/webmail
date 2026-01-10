import { NextResponse } from "next/server";

import { getMessageDetail } from "@/lib/google/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = context.params.id;
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
