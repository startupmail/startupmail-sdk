# @startupmail/sdk

Typed client and runnable examples for [Startup Mail](https://startupmail.dev): a real
custom-domain mailbox for people and AI agents, with a web inbox, API, webhooks, and MCP.

## Install

During the beta, install directly from this public repository:

```bash
npm install github:gustavhartz/startupmail-sdk
```

The package is named `@startupmail/sdk`, so imports use that name:

```ts
import { StartupMail } from "@startupmail/sdk";

const mail = new StartupMail({ apiKey: process.env.STARTUPMAIL_API_KEY! });
const [inbox] = await mail.listMailboxes();

await mail.sendEmail({
  mailboxId: inbox.id,
  to: ["founder@example.com"],
  subject: "Hello",
  text: "Sent from Startup Mail",
});
```

Create a mailbox and a narrowly scoped API key in the
[Startup Mail app](https://startupmail.dev/app). Keep API keys on the server, never in browser
code or a public repository.

## Examples

- [`examples/read-inbox.mjs`](./examples/read-inbox.mjs) lists recent threads.
- [`examples/send-email.mjs`](./examples/send-email.mjs) sends one requested message.
- [`examples/mcp-config.json`](./examples/mcp-config.json) shows the MCP server configuration.

Run an example with a server-side environment variable:

```bash
STARTUPMAIL_API_KEY=sm_live_... node examples/read-inbox.mjs
```

## MCP

The same API key can be used with the Streamable HTTP MCP endpoint at
`https://startupmail.dev/mcp`. Grant only the mailbox and capabilities the agent needs.

## API surface

The client covers tenants, domains, mailboxes, policies, threads, messages, drafts, attachments,
and webhooks. See the [SDK documentation](https://startupmail.dev/docs/sdk) and
[API reference](https://startupmail.dev/docs/api-reference) for the complete method list.

Startup Mail is for direct conversations and requested transactional email. It is not for cold
outreach, newsletters, or bulk campaigns. See the
[acceptable-use policy](https://startupmail.dev/acceptable-use).
