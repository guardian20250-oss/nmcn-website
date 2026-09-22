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

export async function sendEmail({ to, subject, html }: EmailOptions) {
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
