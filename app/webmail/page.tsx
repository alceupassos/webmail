import { WebmailLayout } from "@/components/webmail/webmail-layout";
import { listInboxMessages } from "@/lib/google/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WebmailPage() {
  let messages = [];
  let error: string | null = null;

  try {
    messages = await listInboxMessages({ maxResults: 25 });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load inbox";
  }

  return <WebmailLayout initialMessages={messages} error={error} />;
}
