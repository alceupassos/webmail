"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WizardStep = "intro" | "azure-setup" | "oauth" | "complete";

interface MicrosoftConfigWizardProps {
    onComplete: () => void;
    onCancel: () => void;
}

export function MicrosoftConfigWizard({
    onComplete,
    onCancel,
}: MicrosoftConfigWizardProps) {
    const [step, setStep] = useState<WizardStep>("intro");
    const [label, setLabel] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOAuthConnect = () => {
        setIsLoading(true);
        setError(null);

        // Redirect to actual Microsoft OAuth
        const state = encodeURIComponent(JSON.stringify({ label }));
        window.location.href = `/api/auth/microsoft/authorize?state=${state}`;
    };

    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Conectar Microsoft</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure sua conta Outlook/Office 365 via OAuth2
                        </p>
                    </div>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                </header>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    {step === "intro" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Passo 1: Informações</h2>
                                <p className="text-sm text-muted-foreground">
                                    Você precisará autorizar o acesso à sua conta Microsoft usando
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
                                />
                                <p className="text-xs text-muted-foreground">
                                    Um nome para identificar esta conta
                                </p>
                            </div>

                            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    Requisitos
                                </h3>
                                <ul className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-200">
                                    <li>✓ Conta Microsoft ativa (Outlook/Office 365)</li>
                                    <li>✓ App registrado no Azure AD</li>
                                    <li>✓ Permissões Mail.Read configuradas</li>
                                </ul>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={() => setStep("azure-setup")}
                                    size="lg"
                                >
                                    Continuar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setStep("oauth")}
                                >
                                    Já tenho credenciais Azure AD
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "azure-setup" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    Passo 2: Configurar Azure AD
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Siga os passos abaixo para registrar um aplicativo no Azure
                                    Active Directory.
                                </p>
                            </div>

                            <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">
                                        1. Acesse o Azure Portal
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Vá para{" "}
                                        <a
                                            href="https://portal.azure.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline dark:text-blue-400"
                                        >
                                            portal.azure.com
                                        </a>{" "}
                                        e faça login
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">
                                        2. Registre um novo aplicativo
                                    </h3>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        <li>• Navegue até &quot;Azure Active Directory&quot;</li>
                                        <li>• Clique em &quot;App registrations&quot; → &quot;New registration&quot;</li>
                                        <li>• Nome: &quot;Webmail App&quot; (ou qualquer nome)</li>
                                        <li>
                                            • Supported account types: &quot;Accounts in any organizational
                                            directory and personal Microsoft accounts&quot;
                                        </li>
                                        <li>
                                            • Redirect URI: Web →{" "}
                                            <code className="rounded bg-muted px-1 py-0.5">
                                                {typeof window !== "undefined"
                                                    ? `${window.location.origin}/api/auth/microsoft/callback`
                                                    : "http://localhost:7000/api/auth/microsoft/callback"}
                                            </code>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">
                                        3. Configure permissões
                                    </h3>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        <li>• Vá em &quot;API permissions&quot;</li>
                                        <li>• Adicione &quot;Microsoft Graph&quot; → &quot;Delegated permissions&quot;</li>
                                        <li>• Selecione: Mail.Read, Mail.ReadWrite, offline_access</li>
                                        <li>• Clique em &quot;Grant admin consent&quot;</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">
                                        4. Obtenha as credenciais
                                    </h3>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        <li>
                                            • Copie o <strong>Application (client) ID</strong>
                                        </li>
                                        <li>
                                            • Vá em &quot;Certificates &amp; secrets&quot; → &quot;New client secret&quot;
                                        </li>
                                        <li>
                                            • Copie o <strong>Client secret value</strong>
                                        </li>
                                        <li>• Adicione essas credenciais no arquivo .env.local</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    ⚠️ Importante
                                </h3>
                                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                                    Adicione as seguintes variáveis no arquivo{" "}
                                    <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900">
                                        .env.local
                                    </code>
                                    :
                                </p>
                                <pre className="mt-2 rounded bg-amber-100 p-2 text-xs dark:bg-amber-900">
                                    {`MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
MICROSOFT_REDIRECT_URI=${typeof window !== "undefined" ? `${window.location.origin}/api/auth/microsoft/callback` : "http://localhost:7000/api/auth/microsoft/callback"}`}
                                </pre>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={() => setStep("oauth")}
                                    size="lg"
                                >
                                    Já configurei, continuar
                                </Button>
                                <Button variant="ghost" onClick={() => setStep("intro")}>
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "oauth" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    Passo 3: Autorização OAuth2
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Clique no botão abaixo para ser redirecionado à Microsoft e
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
                                    className="w-full"
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
                                                <path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z" />
                                            </svg>
                                            Conectar com Microsoft
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("azure-setup")}
                                >
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
                                    Sua conta Microsoft foi conectada com sucesso.
                                </p>
                            </div>

                            <Button className="w-full" onClick={handleComplete} size="lg">
                                Concluir
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2">
                    {["intro", "azure-setup", "oauth", "complete"].map((s, index) => {
                        const steps = ["intro", "azure-setup", "oauth", "complete"];
                        const currentIndex = steps.indexOf(step);
                        return (
                            <div
                                key={s}
                                className={`h-2 w-2 rounded-full ${step === s
                                    ? "bg-primary"
                                    : index < currentIndex
                                        ? "bg-primary/50"
                                        : "bg-muted"
                                    }`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
