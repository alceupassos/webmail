#!/usr/bin/env node

/**
 * Webmail MCP Server
 * 
 * This MCP server exposes webmail functionality to other apps like:
 * - WhatsApp integrations
 * - Mobile apps
 * - AI assistants
 * - Other automation tools
 * 
 * Available tools:
 * - list_emails: List inbox emails
 * - get_email: Get email details by ID
 * - search_emails: Search emails by query
 * - get_email_summary: Get AI-generated summary of email
 * - list_accounts: List configured email accounts
 * - test_connection: Test email account connection
 * - list_alerts: List mobile alerts
 * - create_alert: Create a new mobile alert
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Import email providers
import { listInboxMessages as listGmailMessages, getMessageDetail as getGmailDetail } from "./lib/google/gmail.js";
import { testConnection as testImapConnection, type ImapConfig } from "./lib/imap/imap.js";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function getGmailCredentials() {
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        return { refresh_token: process.env.GOOGLE_REFRESH_TOKEN };
    }

    const { data, error } = await supabase
        .from("email_accounts")
        .select("oauth_refresh_token")
        .eq("provider", "gmail")
        .eq("is_primary", true)
        .single();

    if (error || !data?.oauth_refresh_token) {
        return undefined;
    }

    return { refresh_token: data.oauth_refresh_token };
}

// Tool input schemas
const ListEmailsSchema = z.object({
    provider: z.enum(["gmail", "microsoft", "imap"]).optional().describe("Email provider to use (default: gmail)"),
    maxResults: z.number().optional().default(25).describe("Maximum number of emails to return"),
});

const GetEmailSchema = z.object({
    id: z.string().describe("Email ID to retrieve"),
    provider: z.enum(["gmail", "microsoft", "imap"]).optional().describe("Email provider"),
});

const SearchEmailsSchema = z.object({
    query: z.string().describe("Search query (subject, sender, or content)"),
    maxResults: z.number().optional().default(10).describe("Maximum number of results"),
});

const TestConnectionSchema = z.object({
    provider: z.enum(["gmail", "microsoft", "imap"]).describe("Provider to test"),
    // IMAP-specific fields
    imap_host: z.string().optional().describe("IMAP server hostname"),
    imap_port: z.number().optional().default(993).describe("IMAP server port"),
    imap_username: z.string().optional().describe("IMAP username"),
    imap_password: z.string().optional().describe("IMAP password"),
    imap_use_tls: z.boolean().optional().default(true).describe("Use TLS/SSL"),
});

// Create MCP server
const server = new Server(
    {
        name: "webmail-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_emails",
                description: "List emails from the inbox. Returns subject, sender, date, and preview for each email.",
                inputSchema: {
                    type: "object",
                    properties: {
                        provider: {
                            type: "string",
                            enum: ["gmail", "microsoft", "imap"],
                            description: "Email provider to use (default: gmail)",
                        },
                        maxResults: {
                            type: "number",
                            description: "Maximum number of emails to return (default: 25)",
                        },
                    },
                },
            },
            {
                name: "get_email",
                description: "Get full details of a specific email by its ID, including the complete body content.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Email ID to retrieve",
                        },
                        provider: {
                            type: "string",
                            enum: ["gmail", "microsoft", "imap"],
                            description: "Email provider",
                        },
                    },
                    required: ["id"],
                },
            },
            {
                name: "search_emails",
                description: "Search emails by query. Searches in subject, sender, and content.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query",
                        },
                        maxResults: {
                            type: "number",
                            description: "Maximum number of results (default: 10)",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_email_summary",
                description: "Get a summary of an email including key points, action items, and sentiment.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Email ID to summarize",
                        },
                        provider: {
                            type: "string",
                            enum: ["gmail", "microsoft", "imap"],
                            description: "Email provider",
                        },
                    },
                    required: ["id"],
                },
            },
            {
                name: "test_connection",
                description: "Test connection to an email provider. For IMAP, provide connection details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        provider: {
                            type: "string",
                            enum: ["gmail", "microsoft", "imap"],
                            description: "Provider to test",
                        },
                        imap_host: {
                            type: "string",
                            description: "IMAP server hostname (for IMAP provider)",
                        },
                        imap_port: {
                            type: "number",
                            description: "IMAP server port (default: 993)",
                        },
                        imap_username: {
                            type: "string",
                            description: "IMAP username",
                        },
                        imap_password: {
                            type: "string",
                            description: "IMAP password",
                        },
                        imap_use_tls: {
                            type: "boolean",
                            description: "Use TLS/SSL (default: true)",
                        },
                    },
                    required: ["provider"],
                },
            },
            {
                name: "list_alerts",
                description: "List pending mobile alerts",
                inputSchema: {
                    type: "object",
                    properties: {
                        priority: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                            description: "Filter by priority",
                        },
                    },
                },
            },
            {
                name: "create_alert",
                description: "Create a new alert based on an email",
                inputSchema: {
                    type: "object",
                    properties: {
                        email_id: { type: "string" },
                        type: {
                            type: "string",
                            enum: ["urgent", "important", "newsletter", "social", "promo"]
                        },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        title: { type: "string" },
                        preview: { type: "string" },
                    },
                    required: ["email_id", "title"],
                },
            },
        ],
    };
});

// List resources (email accounts)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "webmail://accounts",
                name: "Email Accounts",
                description: "List of configured email accounts",
                mimeType: "application/json",
            },
            {
                uri: "webmail://inbox/summary",
                name: "Inbox Summary",
                description: "Summary of inbox status including unread count and recent emails",
                mimeType: "application/json",
            },
        ],
    };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === "webmail://accounts") {
        // Return configured accounts
        const accounts = [
            {
                provider: "gmail",
                email: process.env.NEXT_PUBLIC_GMAIL_ACCOUNT ?? "Not configured",
                status: process.env.GOOGLE_REFRESH_TOKEN ? "connected" : "not_configured",
            },
            {
                provider: "microsoft",
                status: process.env.MICROSOFT_CLIENT_ID ? "configured" : "not_configured",
            },
        ];

        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(accounts, null, 2),
                },
            ],
        };
    }

    if (uri === "webmail://inbox/summary") {
        try {
            const credentials = await getGmailCredentials();
            const messages = await listGmailMessages({ maxResults: 10, credentials });
            const unread = messages.filter((m) => !m.snippet.startsWith("RE:")).length;

            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            totalRecent: messages.length,
                            unreadEstimate: unread,
                            latestEmails: messages.slice(0, 5).map((m) => ({
                                subject: m.subject,
                                from: m.from,
                                date: m.date,
                            })),
                        }, null, 2),
                    },
                ],
            };
        } catch {
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: "Failed to fetch inbox summary" }),
                    },
                ],
            };
        }
    }

    throw new Error(`Unknown resource: ${uri}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "list_emails": {
                const parsed = ListEmailsSchema.parse(args);
                const provider = parsed.provider ?? "gmail";

                if (provider === "gmail") {
                    const credentials = await getGmailCredentials();
                    const messages = await listGmailMessages({ maxResults: parsed.maxResults, credentials });
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(messages, null, 2),
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ error: `Provider ${provider} not yet implemented for listing` }),
                        },
                    ],
                };
            }

            case "get_email": {
                const parsed = GetEmailSchema.parse(args);
                const provider = parsed.provider ?? "gmail";

                if (provider === "gmail") {
                    const credentials = await getGmailCredentials();
                    const message = await getGmailDetail(parsed.id, credentials);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(message, null, 2),
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ error: `Provider ${provider} not yet implemented` }),
                        },
                    ],
                };
            }

            case "search_emails": {
                const parsed = SearchEmailsSchema.parse(args);

                // For now, list emails and filter client-side
                const credentials = await getGmailCredentials();
                const messages = await listGmailMessages({ maxResults: 50, credentials });
                const query = parsed.query.toLowerCase();
                const filtered = messages.filter((m) =>
                    m.subject.toLowerCase().includes(query) ||
                    m.from.toLowerCase().includes(query) ||
                    m.snippet.toLowerCase().includes(query)
                ).slice(0, parsed.maxResults);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: parsed.query,
                                results: filtered,
                                totalFound: filtered.length,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_email_summary": {
                const parsed = GetEmailSchema.parse(args);
                const provider = parsed.provider ?? "gmail";

                if (provider === "gmail") {
                    const credentials = await getGmailCredentials();
                    const message = await getGmailDetail(parsed.id, credentials);

                    // Generate a simple summary (in production, use AI)
                    const bodyPreview = message.body.slice(0, 500);
                    const hasAttachment = message.body.includes("attachment") || message.body.includes("attached");
                    const isUrgent = message.subject.toLowerCase().includes("urgent") ||
                        message.body.toLowerCase().includes("asap");

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    id: message.id,
                                    subject: message.subject,
                                    from: message.from,
                                    date: message.date,
                                    summary: {
                                        preview: bodyPreview,
                                        hasAttachment,
                                        isUrgent,
                                        wordCount: message.body.split(/\s+/).length,
                                        sentiment: "neutral", // Would use AI for real sentiment
                                    },
                                }, null, 2),
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ error: `Provider ${provider} not yet implemented` }),
                        },
                    ],
                };
            }

            case "test_connection": {
                const parsed = TestConnectionSchema.parse(args);

                if (parsed.provider === "imap") {
                    if (!parsed.imap_host || !parsed.imap_username || !parsed.imap_password) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({ success: false, error: "Missing IMAP credentials" }),
                                },
                            ],
                        };
                    }

                    const config: ImapConfig = {
                        host: parsed.imap_host,
                        port: parsed.imap_port ?? 993,
                        user: parsed.imap_username,
                        password: parsed.imap_password,
                        tls: parsed.imap_use_tls ?? true,
                    };

                    const result = await testImapConnection(config);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(result),
                            },
                        ],
                    };
                }

                if (parsed.provider === "gmail") {
                    const hasCredentials = !!(
                        process.env.GOOGLE_CLIENT_ID &&
                        process.env.GOOGLE_CLIENT_SECRET &&
                        process.env.GOOGLE_REFRESH_TOKEN
                    );

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: hasCredentials,
                                    message: hasCredentials ? "Gmail credentials configured" : "Gmail credentials not configured",
                                }),
                            },
                        ],
                    };
                }

                if (parsed.provider === "microsoft") {
                    const hasCredentials = !!(
                        process.env.MICROSOFT_CLIENT_ID &&
                        process.env.MICROSOFT_CLIENT_SECRET
                    );

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: hasCredentials,
                                    message: hasCredentials ? "Microsoft credentials configured" : "Microsoft credentials not configured",
                                }),
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success: false, error: "Invalid provider" }),
                        },
                    ],
                };
            }

            case "list_alerts": {
                const { data, error } = await supabase
                    .from("email_alerts")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (error) throw error;

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }]
                };
            }

            case "create_alert": {
                // In a real scenario, we would need to know which USER_ID to use.
                // For demonstration, we'll try to find the first user if not provided,
                // or use a placeholder if empty.
                const { data: userData } = await supabase.auth.admin.listUsers();
                const userId = userData?.users[0]?.id || "00000000-0000-0000-0000-000000000000";
                const alertArgs = args as { email_id: string, title: string, preview: string, type?: string, priority?: string };

                const { data, error } = await supabase
                    .from("email_alerts")
                    .insert({
                        user_id: userId,
                        email_id: alertArgs.email_id,
                        title: alertArgs.title,
                        preview: alertArgs.preview,
                        type: alertArgs.type || "urgent",
                        priority: alertArgs.priority || "high",
                        read: false,
                        pushed_to_mobile: true
                    })
                    .select()
                    .single();

                if (error) throw error;

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({ success: true, alert: data })
                    }]
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : "Unknown error",
                    }),
                },
            ],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Webmail MCP Server running on stdio");
}

main().catch(console.error);
