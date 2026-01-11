"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";

interface OAuthCreds {
    provider: string;
    client_id: string;
    redirect_uri: string;
}

interface OAuthCredentialsFormProps {
    provider: "google" | "microsoft";
    onSuccess?: () => void;
}

export function OAuthCredentialsForm({ provider, onSuccess }: OAuthCredentialsFormProps) {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [redirectUri, setRedirectUri] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [existingCreds, setExistingCreds] = useState<OAuthCreds | null>(null);
    const [error, setError] = useState<string | null>(null);

    const defaultRedirectUri = provider === "google"
        ? `${window.location.origin}/api/auth/gmail/callback`
        : `${window.location.origin}/api/auth/microsoft/callback`;

    const loadCredentials = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/oauth-credentials");
            const data = await response.json();
            if (data.success) {
                const creds = data.credentials.find((c: OAuthCreds) => c.provider === provider);
                if (creds) {
                    setExistingCreds(creds);
                    setClientId(creds.client_id);
                    setRedirectUri(creds.redirect_uri);
                }
            }
        } catch (err) {
            console.error("Failed to load credentials", err);
        } finally {
            setIsLoading(false);
        }
    }, [provider]);

    useEffect(() => {
        setRedirectUri(defaultRedirectUri);
        loadCredentials();
    }, [provider, defaultRedirectUri, loadCredentials]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/oauth-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri
                })
            });

            const data = await response.json();
            if (data.success) {
                setExistingCreds(data.data);
                setClientSecret(""); // Clear secret from UI after saving
                onSuccess?.();
            } else {
                throw new Error(data.error || "Erro ao salvar credenciais");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Remover estas credenciais? Você não poderá adicionar novas contas até configurar novamente.")) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/oauth-credentials?provider=${provider}`, {
                method: "DELETE"
            });
            if (response.ok) {
                setExistingCreds(null);
                setClientId("");
                setClientSecret("");
                setRedirectUri(defaultRedirectUri);
            }
        } catch {
            setError("Erro ao remover credenciais");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-4 text-center animate-pulse">Carregando configurações segura...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {existingCreds ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                    )}
                    <h3 className="font-semibold text-lg">
                        Configuração do Projeto {provider === "google" ? "Google Cloud" : "Microsoft Azure"}
                    </h3>
                </div>
                {existingCreds && (
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4 mr-2" /> Remover
                    </Button>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                        id="clientId"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
                        className="bg-black/20 border-white/10"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                        id="clientSecret"
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder={existingCreds ? "••••••••••••••••" : "Sua chave secreta do cliente"}
                        className="bg-black/20 border-white/10"
                        required={!existingCreds}
                    />
                    {existingCreds && (
                        <p className="text-[10px] text-zinc-500 italic">Preencha apenas se desejar alterar a chave secreta atual.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="redirectUri">Redirect URI</Label>
                    <Input
                        id="redirectUri"
                        value={redirectUri}
                        readOnly
                        className="bg-black/40 border-white/10 text-zinc-400 cursor-not-allowed text-xs"
                    />
                    <p className="text-[10px] text-zinc-500">Adicione esta URL no console do desenvolvedor do {provider === "google" ? "Google" : "Microsoft"}.</p>
                </div>

                {error && <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</div>}

                <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                    {isSaving ? "Salvando..." : existingCreds ? "Atualizar Credenciais" : "Configurar e Continuar"}
                </Button>
            </form>
        </div>
    );
}
