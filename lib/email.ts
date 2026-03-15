import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const fromAddress = '"ShipQuickr" <updates@shipquickr.com>';

// Helper to get the absolute URL for images
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shipquickr.com';

const createEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset & Base Styles */
    body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      background-color: #f9fafb; 
      color: #111827; 
      -webkit-font-smoothing: antialiased; 
    }
    
    /* Layout */
    .wrapper { width: 100%; background-color: #f9fafb; padding: 40px 0; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); 
    }
    
    /* Header Section (Logo + Title) */
    .header { 
      padding: 40px 40px 30px 40px; 
      text-align: center; 
      border-bottom: 1px solid #f3f4f6;
    }
    .logo { height: 40px; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto; }
    .header h1 { 
      font-size: 24px; 
      font-weight: 700; 
      color: #111827; 
      letter-spacing: -0.02em; 
    }
    
    /* Content Section */
    .content { padding: 40px; font-size: 16px; line-height: 1.6; color: #374151; }
    .content p { margin-bottom: 20px; }
    .content p:last-child { margin-bottom: 0; }
    
    /* Call to Action Button */
    .btn-container { text-align: center; margin: 32px 0; }
    .button { 
      display: inline-block; 
      padding: 14px 28px; 
      background-color: #2563eb; 
      color: #ffffff; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 16px; 
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    /* Highlight blocks for OTPs or important text */
    strong { color: #111827; font-weight: 600; }
    .otp-code {
      display: inline-block;
      padding: 12px 24px;
      background-color: #f3f4f6;
      border-radius: 8px;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      letter-spacing: 4px;
      margin: 16px 0;
    }
    
    /* Footer Section */
    .footer { 
      padding: 30px 40px; 
      background-color: #fcfcfd; 
      border-top: 1px solid #f3f4f6; 
      text-align: center; 
    }
    .footer p { 
      font-size: 13px; 
      color: #6b7280; 
      line-height: 1.5; 
      margin-bottom: 12px; 
    }
    .footer p:last-child { margin-bottom: 0; }
    .footer-links { margin-bottom: 16px; }
    .footer-links a { 
      color: #9ca3af; 
      text-decoration: none; 
      margin: 0 8px; 
      font-size: 12px; 
      font-weight: 500; 
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <!-- Always use the production URL for the logo so it resolves in email clients -->
        <a href="https://shipquickr.com">
          <img src="https://app.shipquickr.com/shipquickr.png" alt="ShipQuickr Logo" class="logo" />
        </a>
        <h1>${title}</h1>
      </div>
      
      <div class="content">
        ${content}
      </div>
      
      <div class="footer">
        <p>If you did not request this email, there's nothing to worry about — you can safely ignore it.</p>
        <div class="footer-links">
          <a href="https://shipquickr.com/terms-conditions/">Terms</a> &bull;
          <a href="https://shipquickr.com/privacy-policy/">Privacy Policy</a> &bull;
          <a href="https://shipquickr.com/contact-us/">Contact Support</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} ShipQuickr. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendResetEmail(to: string, token: string, role: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/${role}/auth/reset-password?token=${token}`;
  
  // Note: Uses the new .btn-container and .button styles defined in the CSS above
  const content = `
    <p>Hi there,</p>
    <p>We received a request to reset the password for your ShipQuickr account. Click the button below to choose a new password.</p>
    
    <div class="btn-container">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
      This link will securely expire in 15 minutes.
    </p>
  `;
  
  const html = createEmailTemplate('Reset Your Password', content);

  await transporter.sendMail({ from: fromAddress, to, subject: 'Reset Your ShipQuickr Password', html });
}

// Ensure you wrap OTP numbers in <div class="text-center"><span class="otp-code">123456</span></div> when calling this function
export async function sendEmail(options: { to: string; subject: string; html: string }) {
  const html = createEmailTemplate(options.subject, options.html);

  await transporter.sendMail({ from: fromAddress, to: options.to, subject: options.subject, html });
}