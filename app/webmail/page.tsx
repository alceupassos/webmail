import { unstable_noStore as noStore } from "next/cache";

import { WebmailLayout } from "@/components/webmail/webmail-layout";
import { listInboxMessages, type GmailMessageSummary } from "@/lib/google/gmail";

export default async function WebmailPage() {
  noStore();
  let messages: GmailMessageSummary[] = [];
  let error: string | null = null;

  try {
    messages = await listInboxMessages({ maxResults: 25 });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load inbox";
  }

  return <WebmailLayout initialMessages={messages} error={error} />;
}
