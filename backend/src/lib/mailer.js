import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || `Cipher <no-reply@cipher.app>`;


const resendClient = new Resend(process.env.RESEND_API_KEY);

const generateResetPasswordHTML = ({ name = "", resetUrl, expiresIn = "1 hour" }) => {
  const preheader = "Reset your Cipher password (link expires in 1 hour)";
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Reset your password</title>
    </head>
    <body style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;background:#f4f6fb;color:#1f2937;">
    
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:24px;text-align:left;border-bottom:1px solid #eef2f7;">
            <h2 style="margin:0;color:#111827;">Cipher</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;">Hi ${name || "there"},</p>
            <p style="margin:0 0 20px;color:#374151;">We received a request to reset the password for your Cipher account. Click the button below to reset it. This link will expire in ${expiresIn}.</p>

            <p style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Reset password</a>
            </p>

            <hr style="margin:24px 0;border:none;border-top:1px solid #eef2f7" />
            <p style="margin:0;color:#6b7280;font-size:13px;">If you didn’t request a password reset, you can safely ignore this email — your password won’t change. If you’re having trouble, reply to this email and our support team will help.</p>

            <p style="margin-top:20px;color:#9ca3af;font-size:13px;">Thanks,<br/>The Cipher Team</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:12px;">
            © ${new Date().getFullYear()} Cipher. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const resend = async ({ to, subject, text, html }) => {
  return resendClient.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });
};

export const sendResetEmail = async (to, resetUrl, name) => {
  const subject = "Reset your Cipher password";
  const text = `Reset your password by visiting: ${resetUrl} \n\nThis link expires in 1 hour.`;
  const html = generateResetPasswordHTML({ name, resetUrl });
  return resend({ to, subject, text, html });
};

export default { resend, sendResetEmail };
