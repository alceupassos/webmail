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

  const accountLabel =
    process.env.NEXT_PUBLIC_GMAIL_ACCOUNT ?? "Google Mail";

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

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
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
                  <div className="p-4 text-sm text-destructive">{listError}</div>
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
                  <div className="text-sm text-destructive">{detailError}</div>
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
      </div>
    </div>
  );
}
