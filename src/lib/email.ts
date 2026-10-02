import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function readGraphRefreshToken(): Promise<string | null> {
  if (process.env.GRAPH_TOKEN_FILE) {
    try {
      const fs = await import("fs/promises");
      const value = (await fs.readFile(process.env.GRAPH_TOKEN_FILE, "utf8")).trim();
      if (value) return value;
    } catch {}
  }
  return process.env.GRAPH_REFRESH_TOKEN || null;
}

async function graphAccessToken(): Promise<string> {
  const refreshToken = await readGraphRefreshToken();
  if (!process.env.GRAPH_CLIENT_ID || !refreshToken) throw new Error("Graph email not configured");
  const body = new URLSearchParams({
    client_id: process.env.GRAPH_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data: any = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Graph token refresh failed: ${data.error || res.status}`);
  if (data.refresh_token && data.refresh_token !== refreshToken && process.env.GRAPH_TOKEN_FILE) {
    try {
      const fs = await import("fs/promises");
      await fs.writeFile(process.env.GRAPH_TOKEN_FILE, data.refresh_token, { encoding: "utf8", mode: 0o600 });
    } catch {}
  }
  return data.access_token;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (process.env.GRAPH_CLIENT_ID && process.env.GRAPH_REFRESH_TOKEN) {
    try {
      const token = await graphAccessToken();
      const fromAddress = process.env.GRAPH_USER || "nexusmafiacreatornetworkllc@outlook.com";
      const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: "HTML", content: html },
            from: { emailAddress: { address: fromAddress, name: "Nexus Mafia Creator Network LLC" } },
            toRecipients: [{ emailAddress: { address: to } }],
          },
          saveToSentItems: true,
        }),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`Graph sendMail failed (${res.status}): ${detail}`);
      }
      console.log("Email sent via Graph:", { to, subject });
      return { success: true, messageId: "graph" };
    } catch (error) {
      console.error("Graph email error:", error);
      return { success: false, error };
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not configured - skipping send");
    console.log("Would have sent:", { to, subject });
    return { success: false, error: "Email not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"NMCN" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

export function joinApplicationEmail(data: {
  tiktokHandle: string;
  discordHandle: string;
  email: string;
  followerCount: string;
  avgLiveViewers: string;
  agencyExperience: string;
}) {
  return {
    to: process.env.CONTACT_EMAIL || "nexusmafiacreatornetworkllc@outlook.com",
    subject: `New Join Application - ${data.tiktokHandle}`,
    html: `
      <h2>New Join Application</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">TikTok Handle</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.tiktokHandle}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Discord Handle</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.discordHandle}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Follower Count</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.followerCount || "Not provided"}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Avg LIVE Viewers</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.avgLiveViewers || "Not provided"}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Agency Experience</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.agencyExperience || "Not provided"}</td></tr>
      </table>
    `,
  };
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function rejectionEmail(data: {
  tiktokHandle: string;
  email: string;
  note: string;
}) {
  return {
    to: data.email,
    subject: "Your NMCN Application Update",
    html: `
      <h2>Hi ${escapeHtml(data.tiktokHandle.replace(/^@/, ""))},</h2>
      <p>Thank you for applying to join the Nexus Creator Network.</p>
      <p>After reviewing your application, we are unable to move forward at this time.</p>
      ${data.note ? `<p><strong>Reason:</strong></p><p>${escapeHtml(data.note).replace(/\n/g, "<br />")}</p>` : ""}
      <p>You are welcome to reapply in the future once your channel has grown.</p>
      <p>— The NMCN Team</p>
    `,
  };
}

export function testimonialEmail(data: {
  name: string;
  role: string;
  quote: string;
  rating: number;
}) {
  return {
    to: process.env.CONTACT_EMAIL || "nexusmafiacreatornetworkllc@outlook.com",
    subject: `New Testimonial Submission - ${data.name}`,
    html: `
      <h2>New Testimonial Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Role:</strong> ${data.role || "Not provided"}</p>
      <p><strong>Rating:</strong> ${data.rating}/5</p>
      <hr />
      <p>${data.quote.replace(/\n/g, "<br />")}</p>
      <p><em>Awaiting approval in the admin dashboard.</em></p>
    `,
  };
}

export function contactMessageEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return {
    to: process.env.CONTACT_EMAIL || "nexusmafiacreatornetworkllc@outlook.com",
    subject: `New Contact Message - ${data.subject}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>From:</strong> ${data.name} (${data.email})</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <hr />
      <p>${data.message.replace(/\n/g, "<br />")}</p>
    `,
  };
}
