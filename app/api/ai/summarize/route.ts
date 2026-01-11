import { NextResponse } from "next/server";
import { summarizeText } from "@/lib/ai/gemini";

export async function POST(req: Request) {
    try {
        const { text, subject, from } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const summary = await summarizeText(text, subject, from);
        return NextResponse.json({ summary });
    } catch (error) {
        console.error("[SUMMARIZE_API_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
