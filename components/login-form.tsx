"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/webmail");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="glass-card border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] max-w-[400px] w-full mx-auto">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-zinc-400">
            Acesse sua central de inteligência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.nome@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>

            {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Acessando...
                </span>
              ) : "Entrar na Plataforma"}
            </Button>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Não tem uma conta?{" "}
              <Link
                href="/auth/sign-up"
                className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
              >
                Criar conta gratuita
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
