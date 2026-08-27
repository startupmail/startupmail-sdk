import { StartupMail } from "@startupmail/sdk";

const apiKey = process.env.STARTUPMAIL_API_KEY;
if (!apiKey) throw new Error("Set STARTUPMAIL_API_KEY before running this example.");

const mail = new StartupMail({ apiKey });
const [mailbox] = await mail.listMailboxes();

if (!mailbox) throw new Error("Create a mailbox in Startup Mail first.");

const { threads } = await mail.listThreads({
  mailboxId: mailbox.id,
  label: "inbox",
  limit: 10,
});

for (const thread of threads) {
  console.log(`${thread.id}\t${thread.subject}`);
}
