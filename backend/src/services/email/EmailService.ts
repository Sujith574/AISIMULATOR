import * as nodemailer from "nodemailer";
import * as dns from "dns";

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
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
      throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD must be set in .env");
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      lookup: (hostname: string, options: any, callback: any) => {
        dns.lookup(hostname, { ...options, family: 4 }, callback);
      },
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
      margin: 0 0 32px;
      line-height: 1.6;
    }
    .otp-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08));
      border: 1.5px solid rgba(139, 92, 246, 0.3);
      border-radius: 16px;
      padding: 28px 20px;
      margin: 0 0 28px;
    }
    .otp-label {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .otp-code {
      color: #c4b5fd;
      font-size: 44px;
      font-weight: 800;
      letter-spacing: 0.2em;
      font-variant-numeric: tabular-nums;
    }
    .otp-expiry {
      color: #64748b;
      font-size: 12px;
      margin-top: 10px;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.05);
      margin: 28px 0;
    }
    .warning-box {
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.15);
      border-radius: 10px;
      padding: 14px 18px;
      text-align: left;
    }
    .warning-text {
      color: #fbbf24;
      font-size: 11px;
      line-height: 1.7;
      margin: 0;
    }
    .footer {
      color: #475569;
      font-size: 11px;
      margin-top: 28px;
      line-height: 1.6;
    }
    .footer a { color: #8b5cf6; text-decoration: none; }
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

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromUser}>`,
      to: toEmail,
      subject: `${otp} — Your Future Self Simulator Sign-In Code`,
      html: htmlTemplate,
      text: `Your Future Self Simulator OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
    };

    await this.getTransporter().sendMail(mailOptions);
    console.log(`[EmailService] OTP sent to ${toEmail}`);
  }
}

export const emailService = new EmailService();
