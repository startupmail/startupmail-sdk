import type {
  AttachmentUpload,
  CreatedWebhook,
  CreateDraftInput,
  CreateTenantInput,
  CreateWebhookInput,
  Domain,
  Draft,
  Mailbox,
  MailboxPolicy,
  MailboxPolicyInput,
  ProvisionedMailbox,
  ProvisionMailboxInput,
  SendMessageInput,
  SendResult,
  Tenant,
  Thread,
  ThreadDetail,
  UpdateDraftInput,
  Webhook,
} from "./generated/index";

export type * from "./generated/index";

export type MailLabel = "inbox" | "starred" | "sent" | "important" | "archive" | "spam" | "trash";
export type ThreadPage = { threads: Thread[]; nextCursor: string | null };
export type SendEmailInput = SendMessageInput;
export type DraftInput = CreateDraftInput;
export type DraftUpdateInput = UpdateDraftInput;
export type StartupMailOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export class StartupMailError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "StartupMailError";
  }
}

export class StartupMail {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: StartupMailOptions) {
    if (!options.apiKey) throw new Error("A Startup Mail API key is required.");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://startupmail.dev").replace(/\/$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Accept", "application/json");
    if (init.body && !(init.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    const response = await this.fetcher(`${this.baseUrl}${path}`, { ...init, headers });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      throw new StartupMailError(
        payload?.error?.message ?? `Startup Mail request failed (${response.status}).`,
        response.status,
        payload?.error?.code ?? "request_failed",
        response.headers.get("x-request-id"),
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async listMailboxes(): Promise<Mailbox[]> {
    return (await this.request<{ data: Mailbox[] }>("/v1/mailboxes")).data;
  }

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    return (
      await this.request<{ data: Tenant }>("/v1/tenants", {
        method: "POST",
        body: JSON.stringify({ ...input, metadata: input.metadata ?? {} }),
      })
    ).data;
  }

  async listTenants(): Promise<Tenant[]> {
    return (await this.request<{ data: Tenant[] }>("/v1/tenants")).data;
  }

  async createMailbox(input: ProvisionMailboxInput): Promise<ProvisionedMailbox> {
    return (
      await this.request<{ data: ProvisionedMailbox }>("/v1/mailboxes", {
        method: "POST",
        body: JSON.stringify({ ...input, metadata: input.metadata ?? {} }),
      })
    ).data;
  }

  async createDomain(name: string): Promise<Domain> {
    return (
      await this.request<{ data: Domain }>("/v1/domains", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
    ).data;
  }

  async verifyDomain(domainId: string): Promise<Domain> {
    return (
      await this.request<{ data: Domain }>(`/v1/domains/${encodeURIComponent(domainId)}/verify`, {
        method: "POST",
      })
    ).data;
  }

  async setDomainCatchAll(domainId: string, mailboxId: string | null): Promise<Domain> {
    return (
      await this.request<{ data: Domain }>(
        `/v1/domains/${encodeURIComponent(domainId)}/catch-all`,
        { method: "PUT", body: JSON.stringify({ mailboxId }) },
      )
    ).data;
  }

  async createDraft(mailboxId: string, input: DraftInput): Promise<Draft> {
    return (
      await this.request<{ data: Draft }>(`/v1/mailboxes/${encodeURIComponent(mailboxId)}/drafts`, {
        method: "POST",
        body: JSON.stringify({
          ...input,
          cc: input.cc ?? [],
          bcc: input.bcc ?? [],
          attachmentIds: input.attachmentIds ?? [],
        }),
      })
    ).data;
  }

  async listDrafts(mailboxId: string): Promise<Draft[]> {
    return (
      await this.request<{ data: Draft[] }>(`/v1/mailboxes/${encodeURIComponent(mailboxId)}/drafts`)
    ).data;
  }

  async updateDraft(mailboxId: string, draftId: string, input: DraftUpdateInput): Promise<Draft> {
    return (
      await this.request<{ data: Draft }>(
        `/v1/mailboxes/${encodeURIComponent(mailboxId)}/drafts/${encodeURIComponent(draftId)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      )
    ).data;
  }

  async sendDraft(mailboxId: string, draftId: string): Promise<SendResult> {
    return (
      await this.request<{ data: SendResult }>(
        `/v1/mailboxes/${encodeURIComponent(mailboxId)}/drafts/${encodeURIComponent(draftId)}/send`,
        { method: "POST" },
      )
    ).data;
  }

  async createMailboxPolicy(mailboxId: string, input: MailboxPolicyInput): Promise<MailboxPolicy> {
    return (
      await this.request<{ data: MailboxPolicy }>(
        `/v1/mailboxes/${encodeURIComponent(mailboxId)}/policies`,
        { method: "POST", body: JSON.stringify(input) },
      )
    ).data;
  }

  async listMailboxPolicies(mailboxId: string): Promise<MailboxPolicy[]> {
    return (
      await this.request<{ data: MailboxPolicy[] }>(
        `/v1/mailboxes/${encodeURIComponent(mailboxId)}/policies`,
      )
    ).data;
  }

  async deleteMailboxPolicy(mailboxId: string, policyId: string): Promise<void> {
    await this.request<unknown>(
      `/v1/mailboxes/${encodeURIComponent(mailboxId)}/policies/${encodeURIComponent(policyId)}`,
      { method: "DELETE" },
    );
  }

  async listThreads(
    options: {
      mailboxId?: string;
      label?: MailLabel;
      search?: string;
      cursor?: string;
      limit?: number;
    } = {},
  ): Promise<ThreadPage> {
    const query = new URLSearchParams();
    if (options.mailboxId) query.set("mailbox", options.mailboxId);
    if (options.label) query.set("label", options.label);
    if (options.search) query.set("search", options.search);
    if (options.cursor) query.set("cursor", options.cursor);
    if (options.limit) query.set("limit", String(options.limit));
    const suffix = query.size ? `?${query.toString()}` : "";
    const response = await this.request<{ data: Thread[]; nextCursor: string | null }>(
      `/v1/threads${suffix}`,
    );
    return { threads: response.data, nextCursor: response.nextCursor };
  }

  async getThread(threadId: string): Promise<ThreadDetail> {
    return (
      await this.request<{ data: ThreadDetail }>(`/v1/threads/${encodeURIComponent(threadId)}`)
    ).data;
  }

  async uploadAttachment(file: Blob, filename = "attachment"): Promise<AttachmentUpload> {
    const body = new FormData();
    body.set("file", file, filename);
    return (
      await this.request<{ data: AttachmentUpload }>("/v1/attachments", {
        method: "POST",
        body,
      })
    ).data;
  }

  async sendEmail(input: SendEmailInput): Promise<SendResult> {
    const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID();
    return (
      await this.request<{ data: SendResult }>("/v1/messages", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          ...input,
          idempotencyKey,
          attachmentIds: input.attachmentIds ?? [],
          inlineAttachmentIds: input.inlineAttachmentIds ?? [],
        }),
      })
    ).data;
  }

  async reply(input: Omit<SendEmailInput, "replyToMessageId"> & { replyToMessageId: string }) {
    return this.sendEmail(input);
  }

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await this.fetcher(
      `${this.baseUrl}/v1/attachments/${encodeURIComponent(attachmentId)}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
    );
    if (!response.ok)
      throw new StartupMailError(
        "Attachment download failed.",
        response.status,
        "download_failed",
        response.headers.get("x-request-id"),
      );
    return response.blob();
  }

  async listWebhooks(): Promise<Webhook[]> {
    return (await this.request<{ data: Webhook[] }>("/v1/webhooks")).data;
  }

  async createWebhook(input: CreateWebhookInput): Promise<CreatedWebhook> {
    return (
      await this.request<{ data: CreatedWebhook }>("/v1/webhooks", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).data;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request<unknown>(`/v1/webhooks/${encodeURIComponent(webhookId)}`, {
      method: "DELETE",
    });
  }
}
