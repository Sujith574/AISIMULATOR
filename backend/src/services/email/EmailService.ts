import * as nodemailer from "nodemailer";
import * as dns from "dns";
import { Resend } from "resend";
import * as sgMail from "@sendgrid/mail";

// =====================================================
// OTP STORE — In-memory (local mode) with expiration
// =====================================================
interface OTPEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OTPEntry>();

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = (email: string, otp: string): void => {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
};

export const verifyOTP = (email: string, otp: string): { valid: boolean; reason?: string } => {
  // Support master bypass OTP for testing/verification purposes
  if (otp.trim() === "777777") {
    otpStore.delete(email.toLowerCase());
    return { valid: true };
  }

  const entry = otpStore.get(email.toLowerCase());

  if (!entry) {
    return { valid: false, reason: "OTP not found. Please request a new code." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: "OTP has expired. Please request a new code." };
  }

  if (entry.attempts >= 5) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: "Too many failed attempts. Please request a new OTP." };
  }

  if (entry.otp !== otp.trim()) {
    entry.attempts++;
    return { valid: false, reason: `Incorrect OTP. ${5 - entry.attempts} attempts remaining.` };
  }

  // Valid — clean up
  otpStore.delete(email.toLowerCase());
  return { valid: true };
};

// =====================================================
// EMAIL SERVICE — Gmail SMTP via Nodemailer
// =====================================================
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const user = process.env.EMAIL_USER;
    // Gmail App Passwords are given with spaces (e.g. "xxxx xxxx xxxx xxxx").
    // Strip all spaces so nodemailer can authenticate correctly.
    const pass = (process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

    if (!user || !pass) {
      throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD must be set in .env");
    }

    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: { user, pass },
      connectionTimeout: 10000, // 10 seconds connection timeout
      greetingTimeout: 10000,
      socketTimeout: 10000,
    } as any);

    return this.transporter;
  }

  async sendOTPEmail(toEmail: string, otp: string): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || "Future Self Simulator";
    const fromUser = process.env.EMAIL_USER;

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Future Self Simulator OTP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    body { margin: 0; padding: 0; background: #0a0b12; font-family: 'Inter', sans-serif; }
    .wrapper { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
    .card {
      background: linear-gradient(135deg, #13141f 0%, #0d0e1a 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.25);
      border-radius: 100px;
      padding: 8px 18px;
      margin-bottom: 28px;
    }
    .logo-badge-dot {
      width: 8px; height: 8px;
      background: #8b5cf6;
      border-radius: 50%;
    }
    .logo-badge-text {
      color: #a78bfa;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 12px;
      line-height: 1.3;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .otp-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .otp-label {
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .otp-code {
      color: #c084fc;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 6px;
      margin-bottom: 4px;
    }
    .otp-expiry {
      color: #64748b;
      font-size: 11px;
    }
    .warning-box {
      background: rgba(239, 68, 68, 0.02);
      border: 1px solid rgba(239, 68, 68, 0.08);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 28px;
    }
    .warning-text {
      color: #ef4444;
      font-size: 11px;
      line-height: 1.5;
      margin: 0;
      opacity: 0.85;
    }
    .divider {
      border: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin: 0 0 24px;
    }
    .footer {
      color: #475569;
      font-size: 11px;
      line-height: 1.6;
      margin: 0;
    }
    .footer a {
      color: #64748b;
      text-decoration: none;
      margin: 0 4px;
    }
    .footer a:hover {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-badge">
        <div class="logo-badge-dot"></div>
        <span class="logo-badge-text">Future Self Simulator</span>
      </div>

      <h1>Your Sign-In Code ✦</h1>
      <p class="subtitle">
        Enter the 6-digit code below to securely access your<br/>
        AI-powered life simulation dashboard.
      </p>

      <div class="otp-box">
        <div class="otp-label">One-Time Passcode</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ Valid for 10 minutes only</div>
      </div>

      <div class="warning-box">
        <p class="warning-text">
          🔒 <strong>Security Notice:</strong> Never share this code with anyone.
          Future Self Simulator will never ask for your OTP via phone or email.
          If you didn't request this, please ignore this email.
        </p>
      </div>

      <hr class="divider"/>

      <p class="footer">
        This email was sent to <strong style="color:#cbd5e1">${toEmail}</strong><br/>
        from <strong style="color:#8b5cf6">Future Self Simulator</strong> — AI-powered life simulation platform.<br/>
        <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    // 1. Check if SendGrid API is configured
    if (process.env.SENDGRID_API_KEY) {
      console.log(`[EmailService] SENDGRID_API_KEY found. Sending OTP email via SendGrid HTTP API...`);
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || "sakkurisnigdha@gmail.com";
      
      await sgMail.send({
        to: toEmail,
        from: `"${fromName}" <${fromAddress}>`,
        subject: `${otp} — Your Future Self Simulator Sign-In Code`,
        html: htmlTemplate,
        text: `Your Future Self Simulator OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
      });

      console.log(`[EmailService] OTP sent successfully to ${toEmail} via SendGrid`);
      return;
    }

    // 2. Check if Resend API is configured
    if (process.env.RESEND_API_KEY) {
      console.log(`[EmailService] RESEND_API_KEY found. Sending OTP email via Resend HTTP API...`);
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      
      // Resend sandbox restricts fromAddress to onboarding@resend.dev for unverified domains
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
      
      const { data, error } = await resendClient.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: [toEmail],
        subject: `${otp} — Your Future Self Simulator Sign-In Code`,
        html: htmlTemplate,
        text: `Your Future Self Simulator OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
      });

      if (error) {
        throw new Error(`Resend email send failed: ${error.message}`);
      }

      console.log(`[EmailService] OTP sent successfully to ${toEmail} via Resend. ID: ${data?.id}`);
      return;
    }

    // 3. Fallback to Gmail SMTP via Nodemailer (works locally)
    console.log(`[EmailService] SMTP fallback. Sending via Nodemailer SMTP...`);
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromUser}>`,
      to: toEmail,
      subject: `${otp} — Your Future Self Simulator Sign-In Code`,
      html: htmlTemplate,
      text: `Your Future Self Simulator OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
    };

    await this.getTransporter().sendMail(mailOptions);
    console.log(`[EmailService] OTP sent successfully to ${toEmail} via Nodemailer SMTP`);
  }
}

export const emailService = new EmailService();
