"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  GmailMessageDetail,
  GmailMessageSummary,
} from "@/lib/google/gmail";

type WebmailLayoutProps = {
  initialMessages: GmailMessageSummary[];
  error?: string | null;
};

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getSender(value: string) {
  const match = value.match(/^(.*?)</);
  if (!match) return value.split("@")[0];
  return match[1].replace(/["']/g, "").trim() || value.split("@")[0];
}

export function WebmailLayout({ initialMessages, error }: WebmailLayoutProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(initialMessages[0]?.id ?? "");
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [query, setQuery] = useState("");
  const [listError, setListError] = useState(error ?? null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    if (!query.trim()) return messages;
    const q = query.toLowerCase();
    return messages.filter((m) =>
      m.subject.toLowerCase().includes(q) ||
      m.from.toLowerCase().includes(q) ||
      m.snippet.toLowerCase().includes(q)
    );
  }, [messages, query]);

  const refreshInbox = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/gmail/messages?max=25", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao atualizar");
      const data = await res.json();
      setMessages(data.messages);
      setSelectedId((c) => c || data.messages[0]?.id || "");
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Erro");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadMessage = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoadingDetail(true);
    setDetailError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/gmail/messages/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setSelectedMessage(data.message);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Erro");
      setSelectedMessage(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const summarizeWithGemini = async () => {
    if (!selectedMessage) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        body: JSON.stringify({
          text: selectedMessage.body || selectedMessage.snippet,
          subject: selectedMessage.subject,
          from: selectedMessage.from
        }),
      });
      if (!res.ok) throw new Error("Falha no Gemini");
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      console.error(e);
      setSummary("Não foi possível gerar o resumo.");
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    if (!selectedId && filteredMessages[0]) setSelectedId(filteredMessages[0].id);
  }, [filteredMessages, selectedId]);

  useEffect(() => {
    if (selectedId) void loadMessage(selectedId);
  }, [selectedId, loadMessage]);

  return (
    <div className="h-screen bg-background overflow-hidden text-[11px] font-sans">
      {/* Header Premium Glass */}
      <header className="h-11 glass-card border-b border-white/5 flex items-center justify-between px-4 z-10 relative">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-foreground tracking-tight flex items-center gap-2">
            <span className="text-emerald-500 text-sm">📥</span>
            Caixa de Entrada
          </h1>
          <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 h-4.5">
            {messages.length} total
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshInbox}
            disabled={isLoadingList}
            className="h-7 px-3 text-xxs bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all border border-white/5"
          >
            {isLoadingList ? "..." : "Sincronizar"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex h-[calc(100vh-44px)]">
        {/* Message List Premium */}
        <div className="w-72 border-r border-white/5 flex flex-col bg-black/10 backdrop-blur-sm">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">🔍</span>
              <Input
                placeholder="Buscar mensagens..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 text-xxs pl-7 bg-white/5 border-white/5 focus-visible:ring-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {listError ? (
              <p className="p-4 text-xxs text-destructive/80 font-medium">{listError}</p>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center opacity-40">
                <div className="text-3xl mb-2">💨</div>
                <p className="text-xxs font-medium uppercase tracking-widest leading-loose">Vazio</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredMessages.map((msg) => {
                  const isUnread = !msg.snippet.toLowerCase().includes("lido");
                  const isFav = msg.subject.length % 5 === 0;
                  const isReplied = msg.subject.startsWith("Re:");
                  const isRead = !isUnread;

                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedId(msg.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 transition-all flex gap-3 group relative border-b border-white/[0.02] emerald-glow-hover",
                        msg.id === selectedId
                          ? "bg-emerald-500/10 border-l-2 border-l-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                          : "hover:bg-white/[0.03]"
                      )}
                    >
                      {/* Status Indicators refined */}
                      <div className="flex flex-col items-center gap-1.5 w-4 shrink-0 pt-1">
                        {isUnread ? (
                          <div title="Não lido" className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        ) : isRead ? (
                          <span title="Lido" className="text-emerald-500/50 text-[10px]">✓</span>
                        ) : null}

                        <span
                          title={isFav ? "Remover favorito" : "Adicionar favorito"}
                          className={cn(
                            "text-[10px] cursor-pointer transition-all hover:scale-125",
                            isFav ? "text-yellow-500 grayscale-0" : "text-muted-foreground opacity-30 group-hover:opacity-60 grayscale"
                          )}
                        >
                          ⭐
                        </span>

                        {isReplied && (
                          <span title="Respondido" className="text-blue-400 text-[10px]">↩️</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={cn(
                            "text-xxs truncate tracking-tight uppercase",
                            isUnread ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                          )}>
                            {getSender(msg.from)}
                          </span>
                          <span className="text-tiny text-muted-foreground/50 shrink-0 font-mono">
                            {formatDate(msg.date)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xxs truncate leading-tight",
                          isUnread ? "font-semibold text-foreground" : "text-muted-foreground/80"
                        )}>
                          {msg.subject || "(sem assunto)"}
                        </p>
                        <p className="text-tiny text-muted-foreground/40 truncate leading-tight mt-0.5">
                          {msg.snippet}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail Premium Layout */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

          {isLoadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xxs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Lendo E-mail</p>
            </div>
          ) : detailError ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="glass-card p-6 rounded-2xl max-w-sm text-center">
                <div className="text-2xl mb-3">⚠️</div>
                <p className="text-xxs text-destructive font-bold uppercase tracking-wider mb-2">Erro</p>
                <p className="text-xxs text-muted-foreground leading-relaxed">{detailError}</p>
              </div>
            </div>
          ) : selectedMessage ? (
            <>
              {/* Detail Header */}
              <div className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                    {selectedMessage.subject || "(sem assunto)"}
                  </h2>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xxs bg-white/5 hover:bg-white/10 border-white/10">Pasta</Button>
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xxs text-destructive/80 hover:bg-destructive/10 border-destructive/20 transition-colors">Excluir</Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 emerald-glow">
                      {getSender(selectedMessage.from)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xxs font-bold text-foreground">
                        {getSender(selectedMessage.from)}
                      </div>
                      <div className="text-tiny text-muted-foreground font-mono opacity-60">
                        {selectedMessage.from}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3 text-tiny text-muted-foreground/60 font-mono">
                    <span className="flex items-center gap-1"><span className="text-[8px]">📅</span> {formatDate(selectedMessage.date)}</span>
                  </div>
                </div>
              </div>

              {/* Email Content refined typography */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-black/5 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                  {summary && (
                    <div className="mb-6 glass-card p-4 rounded-2xl border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-tiny uppercase tracking-wider">
                        <span>✨ Gemini Insight (Resumo)</span>
                      </div>
                      <p className="text-xxs leading-relaxed italic text-blue-100/80">
                        &quot;{summary}&quot;
                      </p>
                    </div>
                  )}

                  <div className="text-xxs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans glass-card p-6 lg:p-8 rounded-3xl border-white/[0.03] shadow-2xl">
                    {selectedMessage.body || selectedMessage.snippet}
                  </div>
                </div>
              </div>

              {/* Smart Controls Footer */}
              <div className="p-3 lg:p-4 border-t border-white/5 flex items-center gap-2 bg-white/[0.02] backdrop-blur-md">
                <Button size="sm" variant="default" className="h-8 px-5 text-xxs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full emerald-glow group transition-all">
                  Responder <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-5 text-xxs font-medium rounded-full hover:bg-white/5">
                  Encaminhar
                </Button>

                {/* Gemini Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={summarizeWithGemini}
                  disabled={isSummarizing}
                  className="ml-2 h-8 px-3 text-xxs font-bold rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center gap-2 group disabled:opacity-50"
                >
                  <span className={cn("text-sm scale-110", isSummarizing ? "animate-spin" : "group-hover:animate-pulse")}>
                    {isSummarizing ? "⏳" : "✨"}
                  </span>
                  {isSummarizing ? "Processando..." : "Gemini Insight"}
                </Button>

                <div className="ml-auto flex gap-1 items-center px-2 text-muted-foreground/40">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5 hover:text-foreground" title="Imprimir">🖨️</Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5 hover:text-foreground" title="Spam">🚫</Button>
                  <div className="w-[1px] h-4 bg-white/10 mx-1" />
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5 hover:text-foreground">⋯</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center group">
                <div className="text-6xl mb-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 drop-shadow-2xl">⚡</div>
                <p className="text-xxs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40 group-hover:opacity-60 transition-opacity">
                  Selecione para Iniciar
                </p>
                <div className="mt-4 flex justify-center gap-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.2); }
      `}</style>
    </div>
  );
}
