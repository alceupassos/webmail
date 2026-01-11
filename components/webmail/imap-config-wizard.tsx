"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type WizardStep = "intro" | "config" | "test" | "complete";

interface ImapConfigWizardProps {
    onComplete: () => void;
    onCancel: () => void;
}

export function ImapConfigWizard({
    onComplete,
    onCancel,
}: ImapConfigWizardProps) {
    const [step, setStep] = useState<WizardStep>("intro");
    const [label, setLabel] = useState("");
    const [email, setEmail] = useState("");
    const [imapHost, setImapHost] = useState("");
    const [imapPort, setImapPort] = useState("993");
    const [imapUsername, setImapUsername] = useState("");
    const [imapPassword, setImapPassword] = useState("");
    const [useTls, setUseTls] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<string | null>(null);

    const handleTestConnection = async () => {
        setIsLoading(true);
        setError(null);
        setTestResult(null);

        try {
            const response = await fetch("/api/email-config/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "imap",
                    imap_host: imapHost,
                    imap_port: parseInt(imapPort, 10),
                    imap_username: imapUsername,
                    imap_password: imapPassword,
                    imap_use_tls: useTls,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "Failed to test connection");
            }

            if (result.success) {
                setTestResult("Conexão testada com sucesso!");
                setStep("complete");
            } else {
                throw new Error(result.error ?? "Connection test failed");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to test connection");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/email-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "imap",
                    email,
                    label: label || email,
                    imap_host: imapHost,
                    imap_port: parseInt(imapPort, 10),
                    imap_username: imapUsername,
                    imap_password: imapPassword,
                    imap_use_tls: useTls,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error ?? "Failed to save account");
            }

            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save account");
        } finally {
            setIsLoading(false);
        }
    };

    const isConfigValid =
        email.trim() &&
        imapHost.trim() &&
        imapPort.trim() &&
        imapUsername.trim() &&
        imapPassword.trim();

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Conectar IMAP</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure qualquer provedor de email via IMAP
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
                                    Configure uma conta de email usando o protocolo IMAP. Funciona
                                    com a maioria dos provedores como Zoho, FastMail, ProtonMail,
                                    etc.
                                </p>
                            </div>

                            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    ⚠️ Importante
                                </h3>
                                <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                                    <li>
                                        • Use uma <strong>senha de aplicativo</strong> (app password)
                                        ao invés da senha principal
                                    </li>
                                    <li>• Habilite IMAP nas configurações do seu provedor</li>
                                    <li>
                                        • Verifique o servidor IMAP e porta na documentação do
                                        provedor
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                                <h3 className="text-sm font-semibold">
                                    Exemplos de configuração IMAP:
                                </h3>
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <p className="font-semibold">Gmail</p>
                                        <p className="text-muted-foreground">
                                            imap.gmail.com:993 (use OAuth2 ao invés)
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Outlook/Office 365</p>
                                        <p className="text-muted-foreground">
                                            outlook.office365.com:993
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Yahoo Mail</p>
                                        <p className="text-muted-foreground">imap.mail.yahoo.com:993</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Zoho Mail</p>
                                        <p className="text-muted-foreground">imap.zoho.com:993</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">FastMail</p>
                                        <p className="text-muted-foreground">imap.fastmail.com:993</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => setStep("config")}
                                size="lg"
                            >
                                Continuar
                            </Button>
                        </div>
                    )}

                    {step === "config" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    Passo 2: Configuração IMAP
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Preencha os dados de conexão IMAP do seu provedor.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Email <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
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
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Servidor IMAP <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            placeholder="imap.provedor.com"
                                            value={imapHost}
                                            onChange={(e) => setImapHost(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Porta <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="993"
                                            value={imapPort}
                                            onChange={(e) => setImapPort(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Usuário IMAP <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder="Geralmente o mesmo que o email"
                                        value={imapUsername}
                                        onChange={(e) => setImapUsername(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Normalmente é o mesmo que o endereço de email
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Senha / App Password <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={imapPassword}
                                        onChange={(e) => setImapPassword(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use uma senha de aplicativo se disponível
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="use-tls"
                                        checked={useTls}
                                        onCheckedChange={(checked) => setUseTls(checked === true)}
                                    />
                                    <label
                                        htmlFor="use-tls"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Usar SSL/TLS (recomendado)
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={() => setStep("test")}
                                    disabled={!isConfigValid}
                                    size="lg"
                                >
                                    Continuar
                                </Button>
                                <Button variant="ghost" onClick={() => setStep("intro")}>
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "test" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    Passo 3: Testar Conexão
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Vamos testar a conexão com o servidor IMAP antes de salvar.
                                </p>
                            </div>

                            <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Servidor:</span>
                                    <span className="font-medium">
                                        {imapHost}:{imapPort}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Usuário:</span>
                                    <span className="font-medium">{imapUsername}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SSL/TLS:</span>
                                    <span className="font-medium">{useTls ? "Sim" : "Não"}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {testResult && (
                                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-200">
                                    {testResult}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={handleTestConnection}
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading ? "Testando conexão..." : "Testar Conexão"}
                                </Button>
                                <Button variant="ghost" onClick={() => setStep("config")}>
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
                                <h2 className="text-lg font-semibold">Conexão Testada!</h2>
                                <p className="text-sm text-muted-foreground">
                                    A conexão IMAP foi testada com sucesso. Clique em salvar para
                                    adicionar a conta.
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
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading ? "Salvando..." : "Salvar Conta"}
                                </Button>
                                <Button variant="ghost" onClick={() => setStep("test")}>
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2">
                    {["intro", "config", "test", "complete"].map((s, index) => {
                        const steps = ["intro", "config", "test", "complete"];
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
