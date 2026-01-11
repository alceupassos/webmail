import { NextResponse } from "next/server";
import { type EmailAlert } from "@/lib/types/alert-types";

// Mock alerts for initial mobile integration
const alerts: EmailAlert[] = [
    {
        id: "1",
        email_id: "msg-123",
        type: "urgent",
        priority: "high",
        title: "Reunião de Emergência",
        preview: "Precisamos discutir o deploy agora.",
        created_at: new Date().toISOString(),
        read: false,
        pushed_to_mobile: true
    },
    {
        id: "2",
        email_id: "msg-456",
        type: "important",
        priority: "medium",
        title: "Relatório Mensal",
        preview: "Segue o anexo do relatório de vendas.",
        created_at: new Date().toISOString(),
        read: false,
        pushed_to_mobile: false
    }
];

export async function GET() {
    return NextResponse.json({
        success: true,
        data: alerts
    });
}

export async function POST(request: Request) {
    const data = await request.json();
    const newAlert: EmailAlert = {
        id: Math.random().toString(36).substring(7),
        created_at: new Date().toISOString(),
        read: false,
        pushed_to_mobile: false,
        ...data
    };

    // In a real app, save to Supabase
    return NextResponse.json({
        success: true,
        data: newAlert
    });
}
