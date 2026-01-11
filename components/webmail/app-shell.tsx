"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AppShellProps = {
    children: React.ReactNode;
};

const navItems = [
    { href: "/webmail", label: "Caixa de Entrada", icon: "📥" },
    { href: "/webmail/config", label: "Configurações", icon: "⚙️" },
];

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-background text-[11px]">
            {/* Sidebar with Glassmorphism */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-52 glass-card border-r border-sidebar-border/20">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-12 items-center border-b border-sidebar-border/10 px-4">
                        <Link href="/webmail" className="flex items-center gap-2 group">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/20 border border-primary/50 text-primary font-bold text-[10px] emerald-glow group-hover:scale-110 transition-transform">
                                C
                            </div>
                            <span className="text-xs font-bold text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                                CEPALAB Mail
                            </span>
                        </Link>
                    </div>

                    {/* Toolbar / Quick Actions Premium */}
                    <div className="flex items-center justify-around p-3 border-b border-sidebar-border/5 bg-white/5 backdrop-blur-md">
                        <button title="Alertas" className="p-1.5 hover:bg-emerald-500/10 rounded-md relative group transition-colors">
                            <span className="text-sm group-hover:scale-110 block">🔔</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse border border-[var(--background)]"></span>
                        </button>
                        <button title="Sincronizar" className="p-1.5 hover:bg-emerald-500/10 rounded-md group transition-colors">
                            <span className="text-sm group-hover:rotate-180 transition-transform duration-500 block">🔄</span>
                        </button>
                        <button title="Contas" className="p-1.5 hover:bg-emerald-500/10 rounded-md group transition-colors">
                            <span className="text-sm group-hover:scale-110 block">👤</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-0.5 p-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300",
                                        isActive
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 emerald-glow"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    <span className="text-lg opacity-80">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-sidebar-border/10 p-3 bg-white/2">
                        <form action="/auth/logout" method="POST">
                            <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-9 text-xxs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <span className="text-base opacity-70">🚪</span>
                                Sair
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-52 flex-1 relative">
                {/* Modern background gradients */}
                <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />

                {children}
            </main>
        </div>
    );
}
