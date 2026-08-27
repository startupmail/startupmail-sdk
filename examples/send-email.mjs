import { StartupMail } from "@startupmail/sdk";

const apiKey = process.env.STARTUPMAIL_API_KEY;
const recipient = process.env.RECIPIENT_EMAIL;

if (!apiKey) throw new Error("Set STARTUPMAIL_API_KEY before running this example.");
if (!recipient) throw new Error("Set RECIPIENT_EMAIL to an address that expects this message.");

const mail = new StartupMail({ apiKey });
const [mailbox] = await mail.listMailboxes();

if (!mailbox) throw new Error("Create a mailbox in Startup Mail first.");

const result = await mail.sendEmail({
  mailboxId: mailbox.id,
  to: [recipient],
  subject: "Hello from my agent",
  text: "This requested message was sent with the Startup Mail SDK.",
});

console.log(`Queued message ${result.messageId}`);
