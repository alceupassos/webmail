"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EmailAccount } from "@/lib/types/email-account";
import { GmailConfigWizard } from "./gmail-config-wizard";
import { MicrosoftConfigWizard } from "./microsoft-config-wizard";
import { ImapConfigWizard } from "./imap-config-wizard";

type WizardType = "gmail" | "microsoft" | "imap" | null;

export function EmailConfigScreen() {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeWizard, setActiveWizard] = useState<WizardType>(null);

    const loadAccounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/email-config");
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload.error ?? "Failed to load accounts");
            }
            const payload = await response.json();
            setAccounts(payload.accounts);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load accounts");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAccounts();
    }, [loadAccounts]);

    const handleDeleteAccount = useCallback(
        async (id: string) => {
            if (!confirm("Tem certeza que deseja remover esta conta?")) {
                return;
            }

            try {
                const response = await fetch(`/api/email-config/${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    const payload = await response.json();
                    throw new Error(payload.error ?? "Failed to delete account");
                }
                await loadAccounts();
            } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to delete account");
            }
        },
        [loadAccounts]
    );

    const handleToggleActive = useCallback(
        async (id: string, isActive: boolean) => {
            try {
                const response = await fetch(`/api/email-config/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_active: !isActive }),
                });
                if (!response.ok) {
                    const payload = await response.json();
                    throw new Error(payload.error ?? "Failed to update account");
                }
                await loadAccounts();
            } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to update account");
            }
        },
        [loadAccounts]
    );

    const handleSetPrimary = useCallback(
        async (id: string) => {
            try {
                const response = await fetch(`/api/email-config/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_primary: true }),
                });
                if (!response.ok) {
                    const payload = await response.json();
                    throw new Error(payload.error ?? "Failed to set primary account");
                }
                await loadAccounts();
            } catch (err) {
                alert(
                    err instanceof Error ? err.message : "Failed to set primary account"
                );
            }
        },
        [loadAccounts]
    );

    const handleWizardComplete = useCallback(() => {
        setActiveWizard(null);
        void loadAccounts();
    }, [loadAccounts]);

    if (activeWizard === "gmail") {
        return (
            <GmailConfigWizard
                onComplete={handleWizardComplete}
                onCancel={() => setActiveWizard(null)}
            />
        );
    }

    if (activeWizard === "microsoft") {
        return (
            <MicrosoftConfigWizard
                onComplete={handleWizardComplete}
                onCancel={() => setActiveWizard(null)}
            />
        );
    }

    if (activeWizard === "imap") {
        return (
            <ImapConfigWizard
                onComplete={handleWizardComplete}
                onCancel={() => setActiveWizard(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="mx-auto max-w-4xl space-y-6">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold">Configuração de Email</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas contas de email conectadas
                    </p>
                </header>

                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Adicionar Nova Conta</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => setActiveWizard("gmail")}
                            className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-sm transition hover:bg-muted/50"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                <svg
                                    className="h-6 w-6 text-red-600 dark:text-red-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">Gmail</p>
                                <p className="text-xs text-muted-foreground">
                                    Google Workspace
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveWizard("microsoft")}
                            className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-sm transition hover:bg-muted/50"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                <svg
                                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">Microsoft</p>
                                <p className="text-xs text-muted-foreground">
                                    Outlook / Office 365
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveWizard("imap")}
                            className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-sm transition hover:bg-muted/50"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                <svg
                                    className="h-6 w-6 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">IMAP</p>
                                <p className="text-xs text-muted-foreground">
                                    Outro provedor
                                </p>
                            </div>
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Contas Conectadas</h2>
                        <Badge variant="secondary">{accounts.length}</Badge>
                    </div>

                    {isLoading ? (
                        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                            Carregando contas...
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="rounded-lg border bg-card p-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nenhuma conta conectada ainda.
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Adicione uma conta usando os botões acima.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full ${account.provider === "gmail"
                                                    ? "bg-red-100 dark:bg-red-900/20"
                                                    : account.provider === "microsoft"
                                                        ? "bg-blue-100 dark:bg-blue-900/20"
                                                        : "bg-green-100 dark:bg-green-900/20"
                                                }`}
                                        >
                                            <span className="text-xs font-semibold uppercase">
                                                {account.provider.slice(0, 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{account.label}</p>
                                                {account.is_primary && (
                                                    <Badge variant="default" className="text-xs">
                                                        Principal
                                                    </Badge>
                                                )}
                                                {!account.is_active && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Inativa
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {account.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {account.provider === "gmail" && "Gmail"}
                                                {account.provider === "microsoft" && "Microsoft"}
                                                {account.provider === "imap" &&
                                                    `IMAP: ${account.imap_host}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!account.is_primary && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSetPrimary(account.id)}
                                            >
                                                Definir como principal
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleToggleActive(account.id, account.is_active)
                                            }
                                        >
                                            {account.is_active ? "Desativar" : "Ativar"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteAccount(account.id)}
                                        >
                                            Remover
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
