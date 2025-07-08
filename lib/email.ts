import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
});

const fromAddress = '"ShipQuickr" <updates@shipquickr.com>';

const createEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background-color: #1e293b; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px; color: #334155; line-height: 1.6; }
    .content p { margin: 0 0 18px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #f1f5f9; color: #64748b; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { background-color: #f1f5f9; color: #64748b; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ShipQuickr. All rights reserved.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

export async function sendResetEmail(to: string, token: string, role: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/${role}/auth/reset-password?token=${token}`;
  const content = `
    <p>You requested a password reset. Please click the button below to set a new password.</p>
    <p style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </p>
    <p>This link is valid for 15 minutes.</p>
  `;
  const html = createEmailTemplate('Reset Your Password', content);

  await transporter.sendMail({ from: fromAddress, to, subject: 'Reset Your ShipQuickr Password', html });
}

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  const html = createEmailTemplate(options.subject, options.html);

  await transporter.sendMail({ from: fromAddress, to: options.to, subject: options.subject, html });
}