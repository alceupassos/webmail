import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0D0D1A]">
      {/* Cosmic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-900/10 blur-[80px]" />
      </div>

      <nav className="absolute top-0 w-full flex justify-center border-b border-white/5 h-20 bg-[#0D0D1A]/50 backdrop-blur-md z-50">
        <div className="w-full max-w-7xl flex justify-between items-center px-6">
          <div className="flex gap-2 items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              CEPALAB<span className="font-light text-emerald-400">.MAIL</span>
            </span>
          </div>
          <Suspense fallback={<div className="h-10 w-20 bg-white/5 rounded-md animate-pulse" />}>
            <AuthButton />
          </Suspense>
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center max-w-5xl px-6 text-center gap-8 mt-20">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-4 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            I.A. Generativa Nano Banana Pro 3.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 pb-2">
            Sua Central de Email <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-400 to-emerald-400 animate-gradient-x">
              Inteligência Galáctica
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Experimente a fusão definitiva de produtividade e design cósmico.
            Gerencie múltiplas contas com isolamento total e segurança quântica.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <Link
            href="/webmail"
            className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <span className="relative flex items-center gap-2">
              Acessar Webmail
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>

          <Link
            href="/webmail/config"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white rounded-xl font-semibold transition-all backdrop-blur-sm"
          >
            Configurações
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          {[
            {
              title: "Multi-Cloud",
              desc: "Conecte Gmail, Outlook e IMAP em um único painel unificado.",
              icon: (
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              )
            },
            {
              title: "Isolamento Total",
              desc: "Cada usuário possui seu próprio ambiente criptografado e isolado.",
              icon: (
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )
            },
            {
              title: "Design Nano Pro",
              desc: "Interface imersiva focada em produtividade e estética visual.",
              icon: (
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              )
            }
          ].map((card, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.06] transition-all duration-500 text-left">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-white/5">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </main>
  );
}
