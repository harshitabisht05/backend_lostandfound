import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Ensure .env is loaded before transporter is created. Some modules import
// this file before server-level dotenv.config() runs (because of ESM import
// hoisting). Loading dotenv here is safe and idempotent.
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
});

// Verify SMTP connection at startup (non-blocking) so errors are visible early
// Log the effective SMTP configuration (helps diagnose if host/port differ from .env)
console.log("SMTP config:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER && process.env.SMTP_USER.replace(/.(?=.*@)/, '***'),
});

transporter
  .verify()
  .then(() => console.log("✅ SMTP transporter verified"))
  .catch((err) => console.warn("⚠️ SMTP verify failed:", err && err.message ? err.message : err));

export default async function sendEmail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: text || undefined,
    html: html || text || undefined,
  });
  return info;
}
