import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("oauth_credentials")
            .select("provider, client_id, redirect_uri, updated_at")
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            credentials: data
        });
    } catch (error) {
        console.error("[OAUTH_CREDENTIALS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { provider, client_id, client_secret, redirect_uri } = data;

        if (!provider || !client_id || !client_secret || !redirect_uri) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: result, error } = await supabase
            .from("oauth_credentials")
            .upsert({
                user_id: user.id,
                provider,
                client_id,
                client_secret,
                redirect_uri,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: {
                provider: result.provider,
                client_id: result.client_id,
                redirect_uri: result.redirect_uri
            }
        });
    } catch (error) {
        console.error("[OAUTH_CREDENTIALS_POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get("provider");

        if (!provider) {
            return NextResponse.json({ error: "Provider is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("oauth_credentials")
            .delete()
            .eq("user_id", user.id)
            .eq("provider", provider);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[OAUTH_CREDENTIALS_DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
