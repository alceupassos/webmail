"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type TrackedAddress = {
  id: string;
  address: string;
  active: boolean;
  alert: boolean;
  preferred: boolean;
};

function formatListDate(value: string) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDetailDate(value: string) {
  if (!value) {
    return "Unknown date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit).trim()}...`;
}

function getSenderLabel(value: string) {
  const match = value.match(/^(.*?)</);
  if (!match) {
    return value;
  }
  const cleaned = match[1].replace(/["']/g, "").trim();
  return cleaned || value;
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function WebmailLayout({ initialMessages, error }: WebmailLayoutProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(
    initialMessages[0]?.id ?? "",
  );
  const [selectedMessage, setSelectedMessage] =
    useState<GmailMessageDetail | null>(null);
  const [query, setQuery] = useState("");
  const [listError, setListError] = useState(error ?? null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [draftReply, setDraftReply] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [trackingNote, setTrackingNote] = useState<string | null>(null);
  const [summarySchedule, setSummarySchedule] = useState({
    morning: true,
    noon: true,
    afternoon: true,
    evening: true,
  });
  const [trackedAddresses, setTrackedAddresses] = useState<TrackedAddress[]>(
    () => {
      const candidate = process.env.NEXT_PUBLIC_GMAIL_ACCOUNT ?? "";
      return candidate
        ? [
            {
              id: createId(),
              address: candidate,
              active: true,
              alert: true,
              preferred: true,
            },
          ]
        : [];
    },
  );

  const filteredMessages = useMemo(() => {
    if (!query.trim()) {
      return messages;
    }
    const normalized = query.toLowerCase();
    return messages.filter((message) => {
      return (
        message.subject.toLowerCase().includes(normalized) ||
        message.from.toLowerCase().includes(normalized) ||
        message.snippet.toLowerCase().includes(normalized)
      );
    });
  }, [messages, query]);

  const refreshInbox = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const response = await fetch("/api/gmail/messages?max=25", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to refresh inbox");
      }
      const payload = await response.json();
      const nextMessages = payload.messages as GmailMessageSummary[];
      setMessages(nextMessages);
      setSelectedId((current) => current || nextMessages[0]?.id || "");
    } catch (refreshError) {
      setListError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh inbox",
      );
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadMessage = useCallback(async (messageId: string) => {
    if (!messageId) {
      return;
    }
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/gmail/messages/${messageId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to load message");
      }
      const payload = await response.json();
      setSelectedMessage(payload.message as GmailMessageDetail);
    } catch (detailError) {
      setDetailError(
        detailError instanceof Error
          ? detailError.message
          : "Failed to load message",
      );
      setSelectedMessage(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId && filteredMessages[0]) {
      setSelectedId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedId]);

  useEffect(() => {
    if (selectedId) {
      void loadMessage(selectedId);
    }
  }, [selectedId, loadMessage]);

  const journey = useMemo(() => {
    const responded = messages.filter((message) =>
      /^re:/i.test(message.subject),
    );
    const pending = messages.filter(
      (message) => !/^re:/i.test(message.subject),
    );
    return {
      responded: responded.slice(0, 4),
      pending: pending.slice(0, 4),
      respondedCount: responded.length,
      pendingCount: pending.length,
    };
  }, [messages]);

  const preferredAddresses = useMemo(
    () => trackedAddresses.filter((item) => item.preferred),
    [trackedAddresses],
  );

  useEffect(() => {
    setDraftReply("");
    setCopyStatus(null);
    setActionNote(null);
    setChatInput("");
    setChatMessages([]);
    setTrackingNote(null);
  }, [selectedId]);

  const accountLabel =
    process.env.NEXT_PUBLIC_GMAIL_ACCOUNT ?? "Google Mail";

  const summary = useMemo(() => {
    if (!selectedMessage) {
      return null;
    }
    const source = normalizeText(
      selectedMessage.body || selectedMessage.snippet || "",
    );
    const summaryText = source
      ? truncateText(source, 240)
      : "Resumo indisponivel.";
    return {
      summaryText,
      highlights: [
        `Assunto: ${selectedMessage.subject}`,
        `Remetente: ${selectedMessage.from}`,
        `Data: ${formatDetailDate(selectedMessage.date)}`,
      ],
    };
  }, [selectedMessage]);

  const replySuggestions = useMemo(() => {
    if (!selectedMessage) {
      return [];
    }
    const senderLabel = getSenderLabel(selectedMessage.from);
    const subjectLabel = selectedMessage.subject || "sua mensagem";
    return [
      `Ola ${senderLabel}, obrigado pelo email sobre ${subjectLabel}. Vou analisar e retorno em breve.`,
      `Recebido, ${senderLabel}. Posso confirmar os proximos passos?`,
      "Obrigado! Poderia enviar mais informacoes ou anexos para seguirmos?",
    ];
  }, [selectedMessage]);

  const handleCopy = useCallback(async () => {
    if (!draftReply.trim()) {
      setCopyStatus("Nada para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(draftReply);
      setCopyStatus("Copiado.");
    } catch (copyError) {
      setCopyStatus(
        copyError instanceof Error
          ? copyError.message
          : "Falha ao copiar.",
      );
    }
  }, [draftReply]);

  const handleAction = useCallback((label: string) => {
    setActionNote(`Acao registrada: ${label}.`);
  }, []);

  const handleChatSend = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    const fallback =
      selectedMessage?.snippet || selectedMessage?.body || "Sem contexto.";
    const assistantReply: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: selectedMessage
        ? `Ok. Resposta objetiva: ${truncateText(
            normalizeText(fallback),
            140,
          )}`
        : "Selecione um email para contexto.",
    };
    setChatMessages((current) => [...current, userMessage, assistantReply]);
    setChatInput("");
  }, [chatInput, selectedMessage]);

  const handleAddAddress = useCallback(() => {
    const trimmed = newAddress.trim();
    if (!trimmed) {
      setTrackingNote("Digite um endereco valido.");
      return;
    }
    const alreadyExists = trackedAddresses.some(
      (item) => item.address.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyExists) {
      setTrackingNote("Endereco ja esta na lista.");
      return;
    }
    setTrackedAddresses((current) => [
      ...current,
      {
        id: createId(),
        address: trimmed,
        active: true,
        alert: true,
        preferred: false,
      },
    ]);
    setNewAddress("");
    setTrackingNote("Endereco adicionado.");
  }, [newAddress, trackedAddresses]);

  const handleToggleTracked = useCallback(
    (id: string, field: "active" | "alert" | "preferred") => {
      setTrackedAddresses((current) =>
        current.map((item) =>
          item.id === id ? { ...item, [field]: !item[field] } : item,
        ),
      );
    },
    [],
  );

  const handleToggleSchedule = useCallback(
    (field: "morning" | "noon" | "afternoon" | "evening") => {
      setSummarySchedule((current) => ({
        ...current,
        [field]: !current[field],
      }));
    },
    [],
  );

  const handleRemoveTracked = useCallback((id: string) => {
    setTrackedAddresses((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Connected mailbox
            </p>
            <h1 className="text-2xl font-semibold">Webmail</h1>
            <p className="text-sm text-muted-foreground">{accountLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={refreshInbox}
              disabled={isLoadingList}
            >
              {isLoadingList ? "Refreshing..." : "Refresh"}
            </Button>
            <Button disabled>Compose</Button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[240px_1fr_320px]">
          <aside className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Folders</span>
              <Badge variant="secondary">{messages.length}</Badge>
            </div>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <button
                className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-left font-medium"
                type="button"
              >
                Inbox
                <span className="text-xs text-muted-foreground">Primary</span>
              </button>
              <button
                className="flex items-center justify-between rounded-md px-3 py-2 text-left text-muted-foreground"
                type="button"
                disabled
              >
                Sent
                <span className="text-xs">Soon</span>
              </button>
              <button
                className="flex items-center justify-between rounded-md px-3 py-2 text-left text-muted-foreground"
                type="button"
                disabled
              >
                Drafts
                <span className="text-xs">Soon</span>
              </button>
            </nav>
            <div className="mt-6 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Gmail API integration via OAuth2. Add env vars to enable the inbox.
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Jornada de emails
                  </span>
                  <Badge variant="secondary">{messages.length}</Badge>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        Respondidos
                      </span>
                      <Badge variant="secondary">
                        {journey.respondedCount}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      {journey.responded.length ? (
                        journey.responded.map((message) => (
                          <div key={message.id}>
                            <p className="font-medium text-foreground">
                              {truncateText(message.subject, 40)}
                            </p>
                            <p>{truncateText(getSenderLabel(message.from), 28)}</p>
                          </div>
                        ))
                      ) : (
                        <p>Nenhum email respondido ainda.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        Nao respondidos
                      </span>
                      <Badge variant="secondary">
                        {journey.pendingCount}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      {journey.pending.length ? (
                        journey.pending.map((message) => (
                          <div key={message.id}>
                            <p className="font-medium text-foreground">
                              {truncateText(message.subject, 40)}
                            </p>
                            <p>{truncateText(getSenderLabel(message.from), 28)}</p>
                          </div>
                        ))
                      ) : (
                        <p>Nenhum email pendente.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Rastreamento de enderecos
                  </span>
                  <Badge variant="secondary">{trackedAddresses.length}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input
                    placeholder="Adicionar email para rastrear..."
                    value={newAddress}
                    onChange={(event) => setNewAddress(event.target.value)}
                  />
                  <Button size="sm" onClick={handleAddAddress}>
                    Adicionar
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {trackedAddresses.length ? (
                    trackedAddresses.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.address}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveTracked(item.id)}
                          >
                            Remover
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={item.active}
                            onCheckedChange={() =>
                                handleToggleTracked(item.id, "active")
                              }
                            />
                            Rastrear endereco
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={item.alert}
                              onCheckedChange={() =>
                                handleToggleTracked(item.id, "alert")
                              }
                            />
                            Alerta na tela
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={item.preferred}
                              onCheckedChange={() =>
                                handleToggleTracked(item.id, "preferred")
                              }
                            />
                            Preferencial
                          </label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Adicione enderecos para monitorar.
                    </p>
                  )}
                  {trackingNote ? (
                    <p className="text-xs text-muted-foreground">
                      {trackingNote}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Resumo programado
                  </span>
                  <Badge variant="secondary">Agenda</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Envio automatico com inicio do titulo de emails importantes,
                  pendentes e sem resposta.
                </p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={summarySchedule.morning}
                      onCheckedChange={() => handleToggleSchedule("morning")}
                    />
                    Inicio da manha (07:30)
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={summarySchedule.noon}
                      onCheckedChange={() => handleToggleSchedule("noon")}
                    />
                    12:00
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={summarySchedule.afternoon}
                      onCheckedChange={() => handleToggleSchedule("afternoon")}
                    />
                    15:00
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={summarySchedule.evening}
                      onCheckedChange={() => handleToggleSchedule("evening")}
                    />
                    18:00
                  </label>
                </div>
                <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Inclui</p>
                  <ul className="mt-2 space-y-1">
                    <li>Importantes, pendentes e sem resposta</li>
                    <li>CEPALAB e emails preferenciais</li>
                    <li>
                      Preferenciais:{" "}
                      {preferredAddresses.length
                        ? preferredAddresses
                            .map((item) => item.address)
                            .join(", ")
                        : "cepalab"}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="rounded-lg border bg-card shadow-sm">
                <div className="flex items-center gap-2 border-b p-4">
                  <Input
                    placeholder="Search messages..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {listError ? (
                    <div className="p-4 text-sm text-destructive">
                      {listError}
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No messages found.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages.map((message) => {
                        const isActive = message.id === selectedId;
                        return (
                          <button
                            key={message.id}
                            className={cn(
                              "flex w-full flex-col gap-1 px-4 py-3 text-left transition",
                              isActive
                                ? "bg-muted"
                                : "hover:bg-muted/60",
                            )}
                            type="button"
                            onClick={() => setSelectedId(message.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium">
                                {message.from}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatListDate(message.date)}
                              </span>
                            </div>
                            <span className="text-sm font-semibold">
                              {message.subject}
                            </span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {message.snippet}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-card shadow-sm">
                <div className="border-b p-4">
                  <h2 className="text-lg font-semibold">Message</h2>
                </div>
                <div className="flex h-full flex-col gap-4 p-4">
                  {isLoadingDetail ? (
                    <div className="text-sm text-muted-foreground">
                      Loading message...
                    </div>
                  ) : detailError ? (
                    <div className="text-sm text-destructive">
                      {detailError}
                    </div>
                  ) : selectedMessage ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold">
                          {selectedMessage.subject}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          From: {selectedMessage.from}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDetailDate(selectedMessage.date)}
                        </div>
                      </div>
                      <div className="border-t pt-4 text-sm leading-relaxed text-foreground">
                        <p className="whitespace-pre-wrap">
                          {selectedMessage.body}
                        </p>
                      </div>
                      <div className="grid gap-4 pt-2 lg:grid-cols-2">
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              Resumo CEPALAB.IA (CHAT GPT 5.2.MINI)
                            </span>
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                          <p className="mt-3 text-sm text-foreground">
                            {summary?.summaryText ??
                              "Selecione um email para gerar o resumo."}
                          </p>
                          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                            {summary?.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              Sugestoes de resposta automatica pre-pronta
                            </span>
                            <Badge variant="secondary">Beta</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {replySuggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="h-auto whitespace-normal text-left"
                                onClick={() => {
                                  setDraftReply(suggestion);
                                  setCopyStatus(null);
                                }}
                              >
                                {truncateText(suggestion, 80)}
                              </Button>
                            ))}
                            {replySuggestions.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                Nenhuma sugestao disponivel.
                              </span>
                            ) : null}
                          </div>
                          <textarea
                            className="mt-3 min-h-[120px] w-full resize-none rounded-md border bg-background p-3 text-sm"
                            placeholder="Rascunho da resposta..."
                            value={draftReply}
                            onChange={(event) =>
                              setDraftReply(event.target.value)
                            }
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={handleCopy}>
                              Copiar resposta
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setDraftReply("");
                                setCopyStatus(null);
                              }}
                            >
                              Limpar
                            </Button>
                          </div>
                          {copyStatus ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {copyStatus}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Outras funcoes
                          </span>
                          <Badge variant="secondary">Preview</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {[
                            "Marcar como importante",
                            "Criar tarefa",
                            "Salvar contato",
                            "Adicionar lembrete",
                          ].map((label) => (
                            <Button
                              key={label}
                              variant="outline"
                              onClick={() => handleAction(label)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                        {actionNote ? (
                          <p className="mt-3 text-xs text-muted-foreground">
                            {actionNote}
                          </p>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Funcoes adicionais aguardam integracao.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a message to preview its content.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Chat CEPALAB.IA (CHATGPT 5.2)
              </span>
              <Badge variant="secondary">Sidebar</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pergunte sobre o email selecionado. Respostas curtas e diretas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Resumir este email",
                "O que preciso responder?",
                "Pontos criticos",
              ].map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="outline"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
            <div className="mt-4 max-h-[42vh] space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
              {chatMessages.length ? (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-md p-2",
                      message.role === "assistant"
                        ? "bg-background"
                        : "bg-muted",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {message.role === "assistant"
                        ? "CEPALAB.IA"
                        : "Voce"}
                    </p>
                    <p className="mt-1">{message.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Inicie a conversa com uma pergunta.
                </p>
              )}
            </div>
            <textarea
              className="mt-3 min-h-[110px] w-full resize-none rounded-md border bg-background p-3 text-sm"
              placeholder="Digite sua pergunta..."
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={handleChatSend}>Enviar</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setChatInput("");
                  setChatMessages([]);
                }}
              >
                Limpar chat
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
