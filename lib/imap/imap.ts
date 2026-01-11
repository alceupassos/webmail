import Imap from "imap";
import { simpleParser, type AddressObject } from "mailparser";
import type { Readable } from "stream";

export interface ImapConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
}

export interface ImapMessageSummary {
    id: string;
    uid: number;
    subject: string;
    from: string;
    date: string;
    snippet: string;
}

export interface ImapMessageDetail extends ImapMessageSummary {
    body: string;
    to: string;
    html?: string;
}

function createImapConnection(config: ImapConfig): Imap {
    return new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
        connTimeout: 10000,
    });
}

function parseAddress(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) {
        return "Unknown";
    }
    const addressObj = Array.isArray(address) ? address[0] : address;
    if (!addressObj || !addressObj.value || addressObj.value.length === 0) {
        return "Unknown";
    }
    const first = addressObj.value[0];
    if (first.name) {
        return `${first.name} <${first.address}>`;
    }
    return first.address ?? "Unknown";
}

function getSnippet(text: string | undefined, maxLength = 150): string {
    if (!text) return "";
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength).trim() + "...";
}

/**
 * Test IMAP connection
 */
export function testConnection(config: ImapConfig): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        const imap = createImapConnection(config);

        const timeout = setTimeout(() => {
            try {
                imap.end();
            } catch {
                // ignore
            }
            resolve({ success: false, error: "Connection timeout" });
        }, 15000);

        imap.once("ready", () => {
            clearTimeout(timeout);
            imap.end();
            resolve({ success: true });
        });

        imap.once("error", (err: Error) => {
            clearTimeout(timeout);
            resolve({ success: false, error: err.message });
        });

        imap.connect();
    });
}

/**
 * List inbox messages
 */
export function listInboxMessages(
    config: ImapConfig,
    options?: { maxResults?: number }
): Promise<ImapMessageSummary[]> {
    const maxResults = options?.maxResults ?? 25;

    return new Promise((resolve, reject) => {
        const imap = createImapConnection(config);
        const messages: ImapMessageSummary[] = [];

        imap.once("ready", () => {
            imap.openBox("INBOX", true, (err, box) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                const totalMessages = box.messages.total;
                if (totalMessages === 0) {
                    imap.end();
                    return resolve([]);
                }

                // Fetch the most recent messages
                const start = Math.max(1, totalMessages - maxResults + 1);
                const range = `${start}:${totalMessages}`;

                const fetch = imap.seq.fetch(range, {
                    bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)"],
                    struct: true,
                });

                fetch.on("message", (msg) => {
                    let uid = 0;
                    const headers: Record<string, string[]> = {};

                    msg.on("body", (stream) => {
                        let buffer = "";
                        stream.on("data", (chunk) => {
                            buffer += chunk.toString("utf8");
                        });
                        stream.once("end", () => {
                            // Parse headers
                            const lines = buffer.split(/\r?\n/);
                            let currentHeader = "";
                            for (const line of lines) {
                                if (/^\s/.test(line) && currentHeader) {
                                    // Continuation of previous header
                                    headers[currentHeader][headers[currentHeader].length - 1] += " " + line.trim();
                                } else {
                                    const match = line.match(/^([^:]+):\s*(.*)$/);
                                    if (match) {
                                        currentHeader = match[1].toLowerCase();
                                        if (!headers[currentHeader]) {
                                            headers[currentHeader] = [];
                                        }
                                        headers[currentHeader].push(match[2]);
                                    }
                                }
                            }
                        });
                    });

                    msg.once("attributes", (attrs) => {
                        uid = attrs.uid;
                    });

                    msg.once("end", () => {
                        messages.push({
                            id: `${uid}`,
                            uid,
                            subject: headers["subject"]?.[0] ?? "(no subject)",
                            from: headers["from"]?.[0] ?? "Unknown",
                            date: headers["date"]?.[0] ?? "",
                            snippet: "", // Will be populated if we fetch body
                        });
                    });
                });

                fetch.once("error", (fetchErr) => {
                    imap.end();
                    reject(fetchErr);
                });

                fetch.once("end", () => {
                    imap.end();
                    // Reverse to show newest first
                    resolve(messages.reverse());
                });
            });
        });

        imap.once("error", (err: Error) => {
            reject(err);
        });

        imap.connect();
    });
}

/**
 * Get message detail by UID
 */
export function getMessageDetail(
    config: ImapConfig,
    uid: number
): Promise<ImapMessageDetail> {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection(config);

        imap.once("ready", () => {
            imap.openBox("INBOX", true, (err) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                const fetch = imap.fetch(uid, {
                    bodies: "",
                    struct: true,
                });

                fetch.on("message", (msg) => {
                    msg.on("body", (stream) => {
                        simpleParser(stream as Readable, (parseErr, parsed) => {
                            if (parseErr) {
                                imap.end();
                                return reject(parseErr);
                            }

                            const result: ImapMessageDetail = {
                                id: `${uid}`,
                                uid,
                                subject: parsed.subject ?? "(no subject)",
                                from: parseAddress(parsed.from),
                                to: parseAddress(parsed.to),
                                date: parsed.date?.toISOString() ?? "",
                                snippet: getSnippet(parsed.text),
                                body: parsed.text ?? "",
                                html: parsed.html || undefined,
                            };

                            imap.end();
                            resolve(result);
                        });
                    });
                });

                fetch.once("error", (fetchErr) => {
                    imap.end();
                    reject(fetchErr);
                });
            });
        });

        imap.once("error", (err: Error) => {
            reject(err);
        });

        imap.connect();
    });
}
