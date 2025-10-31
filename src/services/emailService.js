const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if email credentials are configured
      const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
      
      if (!hasEmailConfig) {
        console.warn('⚠️ Email credentials not configured. Using test account...');
        // Create a test account for development
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        console.log('📧 Test email account created. Check console for preview URLs.');
      } else {
        // Use real email configuration (Gmail or other service)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        console.log(`📧 Using ${process.env.EMAIL_SERVICE || 'gmail'} email service with ${process.env.EMAIL_USER}`);
      }

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Don't throw error to allow app to start without email
    }
  }

  async sendOTP(email, otp, type) {
    if (!this.transporter) {
      console.warn('⚠️ Email service not available, OTP not sent');
      console.log(`📧 Mock OTP for ${email}: ${otp} (type: ${type})`);
      return { success: true, messageId: 'mock', preview: 'Email service disabled' };
    }

    try {
      const subject = this.getSubjectByType(type);
      const html = this.getOTPEmailTemplate(otp, type);

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Blockchain Voting System" <noreply@votingsystem.com>',
        to: email,
        subject: subject,
        html: html,
      });

      console.log(`📧 OTP email sent to ${email}: ${info.messageId}`);
      
      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        preview: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  getSubjectByType(type) {
    switch (type) {
      case 'registration':
        return 'Welcome! Verify your email address';
      case 'login':
        return 'Your login verification code';
      case 'password_reset':
        return 'Password reset verification code';
      default:
        return 'Your verification code';
    }
  }

  getOTPEmailTemplate(otp, type) {
    const title = this.getSubjectByType(type);
    const message = this.getMessageByType(type);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 2px dashed #667eea; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🗳️ Blockchain Voting System</h1>
            <p>${title}</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>${message}</p>
            <div class="otp-code">${otp}</div>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</li>
                    <li>Do not share this code with anyone</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p>Best regards,<br>Blockchain Voting System Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 Blockchain Voting System. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
  }

  getMessageByType(type) {
    switch (type) {
      case 'registration':
        return 'Thank you for registering with our Blockchain Voting System. Please use the following verification code to complete your registration:';
      case 'login':
        return 'You are attempting to log in to your Blockchain Voting System account. Please use the following verification code to complete your login:';
      case 'password_reset':
        return 'You have requested to reset your password. Please use the following verification code to reset your password:';
      default:
        return 'Please use the following verification code:';
    }
  }

  maskEmail(email) {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.substring(0, 2)}***@${domain}`;
  }
}

module.exports = new EmailService();