import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Activity from '../models/Activity.js';
import { makeActivityPayload } from './activityHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let transporter = null;
let warned = false;

function ensureTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USERNAME || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  const host = process.env.SMTP_SERVER || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;

  if (!user || !pass) {
    if (!warned) {
      console.warn('[MAILER] SMTP_USERNAME or SMTP_PASSWORD is missing - emails will not send.');
    }
    warned = true;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(to, subject, text, html = null) {
  const tx = ensureTransporter();
  if (!tx || !to) return; // fail silently if not configured

  try {
    const mailOptions = {
      from: process.env.SMTP_USERNAME || process.env.EMAIL_USER,
      to,
      subject,
      text,
    };
    if (html) mailOptions.html = html;

    const info = await tx.sendMail(mailOptions);

    try {
      const payload = makeActivityPayload({
        type: 'mail:sent',
        message: `Email: ${subject}`,
        meta: {
          to: to,
          subject,
          text,
          info: info && info.messageId ? { messageId: info.messageId } : {}
        },
        userId: null,
        userName: String(to)
      });
      Activity.create(payload).catch(e => {
        console.warn('[MAILER] Activity logging failed:', e?.message || e);
      });
    } catch (e) {
      console.warn('[MAILER] Activity prepare failed:', e?.message || e);
    }

    console.log(`[MAILER] ✉ Email sent to ${to}: ${subject}`);
    return info;
  } catch (err) {
    console.error('[MAILER ERROR] ❌', err?.message || err);
    throw err;
  }
}
