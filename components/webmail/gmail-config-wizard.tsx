"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { OAuthCredentialsForm } from "./oauth-credentials-form";

type WizardStep = "credentials" | "intro" | "oauth" | "complete";

interface GmailConfigWizardProps {
    onComplete: () => void;
    onCancel: () => void;
}

export function GmailConfigWizard({
    onComplete,
    onCancel,
}: GmailConfigWizardProps) {
    const [step, setStep] = useState<WizardStep>("credentials");
    const [label, setLabel] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOAuthConnect = () => {
        setIsLoading(true);
        setError(null);

        // Redirect to actual Gmail OAuth
        const state = encodeURIComponent(JSON.stringify({ label }));
        window.location.href = `/api/auth/gmail/authorize?state=${state}`;
    };

    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Conectar Gmail</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure sua conta Gmail via OAuth2
                        </p>
                    </div>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                </header>

                <div className="rounded-lg border bg-card p-6 shadow-sm glass-card border-white/10">
                    {step === "credentials" && (
                        <OAuthCredentialsForm
                            provider="google"
                            onSuccess={() => setStep("intro")}
                        />
                    )}

                    {step === "intro" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Passo 1: Informações</h2>
                                <p className="text-sm text-muted-foreground">
                                    Você precisará autorizar o acesso à sua conta Gmail usando
                                    OAuth2. Isso é seguro e você pode revogar o acesso a qualquer
                                    momento.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Nome da conta (opcional)
                                </label>
                                <Input
                                    placeholder="Ex: Trabalho, Pessoal..."
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Um nome para identificar esta conta
                                </p>
                            </div>

                            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
                                <h3 className="text-sm font-semibold text-emerald-400">
                                    Tudo Pronto!
                                </h3>
                                <ul className="mt-2 space-y-1 text-xs text-emerald-300/70">
                                    <li>✓ Projeto Google Cloud Configurado no Supabase</li>
                                    <li>✓ Redirect URI Autorizada</li>
                                    <li>✓ Conta Google Ativa disponível</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setStep("credentials")}>
                                    Ajustar Credenciais
                                </Button>
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                    onClick={() => setStep("oauth")}
                                    size="lg"
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "oauth" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    Passo 2: Autorização OAuth2
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Clique no botão abaixo para ser redirecionado ao Google e
                                    autorizar o acesso.
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                                    onClick={handleOAuthConnect}
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading ? (
                                        "Conectando..."
                                    ) : (
                                        <>
                                            <svg
                                                className="mr-2 h-5 w-5"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                            </svg>
                                            Conectar com Google
                                        </>
                                    )}
                                </Button>
                                <Button variant="ghost" onClick={() => setStep("intro")}>
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "complete" && (
                        <div className="space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                <svg
                                    className="h-8 w-8 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Conta Conectada!</h2>
                                <p className="text-sm text-muted-foreground">
                                    Sua conta Gmail foi conectada com sucesso.
                                </p>
                            </div>

                            <Button className="w-full" onClick={handleComplete} size="lg">
                                Concluir
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2">
                    {["intro", "oauth", "complete"].map((s, index) => (
                        <div
                            key={s}
                            className={`h-2 w-2 rounded-full ${step === s
                                ? "bg-primary"
                                : index <
                                    ["intro", "oauth", "complete"].indexOf(step)
                                    ? "bg-primary/50"
                                    : "bg-muted"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
