import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const SITE_URL = "https://nexusmafiaagency.com";

export const CARRIER_GATEWAYS: Record<string, { label: string; gateway: string }> = {
  att: { label: "AT&T", gateway: "txt.att.net" },
  verizon: { label: "Verizon", gateway: "vtext.com" },
  tmobile: { label: "T-Mobile", gateway: "tmomail.net" },
  boost: { label: "Boost Mobile", gateway: "myboostmobile.com" },
  cricket: { label: "Cricket", gateway: "sms.cricketwireless.net" },
  metro: { label: "Metro by T-Mobile", gateway: "mymetropcs.com" },
  uscellular: { label: "US Cellular", gateway: "email.uscc.net" },
  googlefi: { label: "Google Fi", gateway: "fi.google.com" },
};

export interface SupportSettingsData {
  discordWebhookUrl: string;
  notifyPhone: string;
  notifyCarrier: string;
  notifyEmail: string;
}

const DEFAULT_SETTINGS: SupportSettingsData = {
  discordWebhookUrl: "",
  notifyPhone: "",
  notifyCarrier: "",
  notifyEmail: "nexusmafiacreatornetworkllc@outlook.com",
};

export type TicketLike = {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  email: string;
  name: string | null;
  phone: string | null;
  accessToken: string | null;
  createdAt: Date | string;
  handledBy?: { name: string } | null;
};

export type ReplyLike = {
  id: number;
  authorType: string;
  authorName: string;
  message: string;
  createdAt: Date | string;
};

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmtDate(value: Date | string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function ticketPortalUrl(ticket: TicketLike): string | null {
  if (!ticket.accessToken) return null;
  return `${SITE_URL}/support/${ticket.id}?token=${ticket.accessToken}`;
}

export async function getSupportSettings(): Promise<SupportSettingsData> {
  try {
    const s = await prisma.supportSettings.findUnique({ where: { id: 1 } });
    if (!s) return { ...DEFAULT_SETTINGS };
    return {
      discordWebhookUrl: s.discordWebhookUrl,
      notifyPhone: s.notifyPhone,
      notifyCarrier: s.notifyCarrier,
      notifyEmail: s.notifyEmail || DEFAULT_SETTINGS.notifyEmail,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function sendDiscordWebhook(
  settings: SupportSettingsData,
  payload: { title: string; description: string; url?: string; color?: number }
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.discordWebhookUrl) return { ok: false, error: "No webhook configured" };
  if (!settings.discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return { ok: false, error: "Invalid webhook URL" };
  }
  try {
    const res = await fetch(settings.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "NMCN Support",
        embeds: [
          {
            title: payload.title,
            description: payload.description,
            ...(payload.url ? { url: payload.url } : {}),
            color: payload.color ?? 0xf5c54b,
            timestamp: new Date().toISOString(),
            footer: { text: "Nexus Creator Network Support" },
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { ok: false, error: `Discord responded ${res.status}` };
    return { ok: true };
  } catch (err) {
    console.error("Discord webhook error:", err);
    return { ok: false, error: "Webhook request failed" };
  }
}

export async function sendSms(
  settings: SupportSettingsData,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const carrier = CARRIER_GATEWAYS[settings.notifyCarrier];
  const digits = (settings.notifyPhone || "").replace(/\D/g, "");
  if (!carrier || !digits) return { ok: false, error: "SMS not configured" };
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length < 7) return { ok: false, error: "Phone number looks invalid" };
  const result = await sendEmail({
    to: `${local}@${carrier.gateway}`,
    subject: message,
    html: `<p>${escapeHtml(message)}</p>`,
  });
  if (!result.success) {
    console.error("SMS (email-to-SMS) error:", result.error);
    return { ok: false, error: "SMS send failed (is SMTP configured?)" };
  }
  return { ok: true };
}

export async function sendTicketCreatedNotifications(ticket: TicketLike): Promise<void> {
  const settings = await getSupportSettings();
  const from = [ticket.name, ticket.email].filter(Boolean).join(" · ");
  const snippet =
    ticket.message.length > 400 ? `${ticket.message.slice(0, 400)}…` : ticket.message;

  const tasks: Promise<unknown>[] = [];

  if (settings.discordWebhookUrl) {
    tasks.push(
      sendDiscordWebhook(settings, {
        title: `New support ticket #${ticket.id}: ${ticket.subject}`,
        description: `**From:** ${escapeHtml(from)}\n**Category:** ${escapeHtml(ticket.category)}\n**Status:** Open\n\n${escapeHtml(snippet)}`,
        url: `${SITE_URL}/admin/tickets`,
      })
    );
  }

  if (settings.notifyPhone && settings.notifyCarrier) {
    const sms = `NMCN support ticket #${ticket.id}: ${ticket.subject}`.slice(0, 150);
    tasks.push(sendSms(settings, sms));
  }

  const results = await Promise.all(tasks);
  for (const r of results) {
    const res = r as { ok: boolean; error?: string };
    if (!res.ok && res.error !== "No webhook configured" && res.error !== "SMS not configured") {
      console.error("Ticket notification failed:", res.error);
    }
  }
}

export function replyEmailHtml(
  ticket: TicketLike,
  reply: { authorName: string; message: string; createdAt: Date | string }
): string {
  const link = ticketPortalUrl(ticket);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #111;">
      <h2 style="margin-bottom: 4px;">We replied to your support ticket</h2>
      <p style="color: #666; margin-top: 0;">
        Ticket #${ticket.id} — ${escapeHtml(ticket.subject)}
      </p>
      <div style="border-left: 3px solid #f5c54b; padding: 8px 14px; background: #fafafa; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #666;">
          <strong>${escapeHtml(reply.authorName)}</strong> · ${fmtDate(reply.createdAt)}
        </p>
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(reply.message)}</p>
      </div>
      ${
        link
          ? `<p><a href="${link}" style="background: #111; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Reply in the support portal</a></p>`
          : `<p>You can reply directly to this email ticket through your account dashboard.</p>`
      }
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Nexus Creator Network · Support
      </p>
    </div>
  `;
}

export function transcriptHtml(ticket: TicketLike, replies: ReplyLike[]): string {
  const entries: string[] = [
    `
    <div style="margin-bottom: 14px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #666;">
        <strong>${escapeHtml(ticket.name || ticket.email)}</strong>
        (submitter) · ${fmtDate(ticket.createdAt)}
      </p>
      <div style="white-space: pre-wrap; border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 12px;">${escapeHtml(ticket.message)}</div>
    </div>`,
  ];
  for (const r of replies) {
    const isStaff = r.authorType === "staff";
    entries.push(
      `
    <div style="margin-bottom: 14px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: ${isStaff ? "#8a6d1a" : "#333"};">
        <strong>${escapeHtml(r.authorName)}</strong>
        (${isStaff ? "NMCN staff" : "user"}) · ${fmtDate(r.createdAt)}
      </p>
      <div style="white-space: pre-wrap; border: 1px solid #e5e5e5; border-left: 3px solid ${isStaff ? "#f5c54b" : "#333"}; border-radius: 6px; padding: 10px 12px; background: ${isStaff ? "#fffdf5" : "#fff"};">${escapeHtml(r.message)}</div>
    </div>`
    );
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; color: #111;">
      <h2 style="margin-bottom: 4px;">Ticket #${ticket.id} closed — transcript</h2>
      <p style="color: #666; margin-top: 0;">
        <strong>Subject:</strong> ${escapeHtml(ticket.subject)}<br />
        <strong>Category:</strong> ${escapeHtml(ticket.category)}<br />
        <strong>Status:</strong> ${escapeHtml(ticket.status)}<br />
        <strong>Submitter:</strong> ${escapeHtml(ticket.name || "—")} (${escapeHtml(ticket.email)})
      </p>
      <hr style="border: none; border-top: 1px solid #ddd;" />
      ${entries.join("")}
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        This ticket has been marked resolved. Full conversation history is included above.
      </p>
    </div>
  `;
}

export async function sendTranscriptEmails(
  ticket: TicketLike,
  replies: ReplyLike[],
  settings?: SupportSettingsData
): Promise<void> {
  const s = settings ?? (await getSupportSettings());
  const recipients = Array.from(
    new Set([s.notifyEmail || DEFAULT_SETTINGS.notifyEmail, ticket.email])
  );
  const html = transcriptHtml(ticket, replies);
  const results = await Promise.all(
    recipients.map(to =>
      sendEmail({
        to,
        subject: `[Ticket #${ticket.id}] Resolved: ${ticket.subject} — transcript`,
        html,
      })
    )
  );
  for (const [i, r] of results.entries()) {
    if (!r.success) console.error(`Transcript email to ${recipients[i]} failed:`, r.error);
  }
}

export async function sendReplyNotificationEmail(
  ticket: TicketLike,
  reply: { authorName: string; message: string; createdAt: Date | string }
): Promise<void> {
  const result = await sendEmail({
    to: ticket.email,
    subject: `Re: [Ticket #${ticket.id}] ${ticket.subject}`,
    html: replyEmailHtml(ticket, reply),
  });
  if (!result.success) console.error("Reply notification email failed:", result.error);
}
