import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

const REQUIRED_ENV = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

function getEnvValue(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function createGmailClient(credentials?: { refresh_token: string }) {
  for (const name of REQUIRED_ENV) {
    getEnvValue(name);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const refreshToken = credentials?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error("Google Refresh Token not found. Please configure GOOGLE_REFRESH_TOKEN or add an account via OAuth.");
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
) {
  if (!headers) {
    return null;
  }
  const header = headers.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );
  return header?.value ?? null;
}

function decodeBase64Url(data: string) {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(normalized, "base64");
  return buffer.toString("utf-8");
}

function stripHtml(html: string) {
  const withoutScripts = html.replace(
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    "",
  );
  const withoutStyles = withoutScripts.replace(
    /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
    "",
  );
  return withoutStyles.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type BodyCandidate = { content: string; mimeType: "text/plain" | "text/html" };
type HtmlCandidate = { content: string; mimeType: "text/html" };

function isHtmlCandidate(candidate: BodyCandidate): candidate is HtmlCandidate {
  return candidate.mimeType === "text/html";
}

function extractBestBody(
  part: gmail_v1.Schema$MessagePart | undefined,
): BodyCandidate | null {
  if (!part) {
    return null;
  }

  if (part.mimeType === "text/plain" && part.body?.data) {
    return { content: decodeBase64Url(part.body.data), mimeType: "text/plain" };
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return { content: decodeBase64Url(part.body.data), mimeType: "text/html" };
  }

  if (!part.parts?.length) {
    return null;
  }

  let htmlCandidate: HtmlCandidate | null = null;

  for (const child of part.parts) {
    const found = extractBestBody(child);
    if (!found) {
      continue;
    }
    if (found.mimeType === "text/plain") {
      return found;
    }
    if (!htmlCandidate && isHtmlCandidate(found)) {
      htmlCandidate = found;
    }
  }

  return htmlCandidate;
}

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

export type GmailMessageDetail = GmailMessageSummary & {
  body: string;
};

export async function listInboxMessages(options?: { maxResults?: number, credentials?: { refresh_token: string } }) {
  const gmail = createGmailClient(options?.credentials);
  const maxResults = options?.maxResults ?? 20;

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messages = listResponse.data.messages ?? [];
  const details = await Promise.all(
    messages.map(async (message) => {
      const messageId = message.id ?? "";
      const threadId = message.threadId ?? "";
      if (!messageId) {
        return null;
      }

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = detail.data.payload?.headers ?? [];
      const subject = getHeader(headers, "Subject") ?? "(no subject)";
      const from = getHeader(headers, "From") ?? "Unknown sender";
      const date = getHeader(headers, "Date") ?? "";
      const snippet = detail.data.snippet ?? "";

      return {
        id: messageId,
        threadId,
        subject,
        from,
        date,
        snippet,
      } satisfies GmailMessageSummary;
    }),
  );

  return details.filter((item): item is GmailMessageSummary => item !== null);
}

export async function getMessageDetail(id: string, credentials?: { refresh_token: string }) {
  const gmail = createGmailClient(credentials);

  const detail = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });

  const headers = detail.data.payload?.headers ?? [];
  const subject = getHeader(headers, "Subject") ?? "(no subject)";
  const from = getHeader(headers, "From") ?? "Unknown sender";
  const date = getHeader(headers, "Date") ?? "";
  const snippet = detail.data.snippet ?? "";

  const bodyCandidate = extractBestBody(detail.data.payload);
  const body =
    bodyCandidate?.mimeType === "text/html"
      ? stripHtml(bodyCandidate.content)
      : bodyCandidate?.content ?? "";

  return {
    id,
    threadId: detail.data.threadId ?? "",
    subject,
    from,
    date,
    snippet,
    body: body || snippet,
  } satisfies GmailMessageDetail;
}
