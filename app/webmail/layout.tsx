import { AppShell } from "@/components/webmail/app-shell";

export default function WebmailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}
