const nodemailer = require('nodemailer');

// Email configuration
// In production, use a real email service like SendGrid, AWS SES, or Mailgun
const createTransporter = () => {
    // For development: Use Ethereal Email (fake SMTP service for testing)
    // For production: Use real SMTP credentials
    
    if (process.env.NODE_ENV === 'production') {
        // Production email service (e.g., SendGrid, AWS SES, Mailgun)
        return nodemailer.createTransporter({
            service: 'gmail', // or your email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Development: Use Ethereal Email for testing
        return nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_EMAIL || 'test@ethereal.email',
                pass: process.env.ETHEREAL_PASSWORD || 'testpassword'
            }
        });
    }
};

/**
 * Send password reset email
 * 
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name
 */
const sendPasswordResetEmail = async (to, resetToken, userName) => {
    try {
        const transporter = createTransporter();
        
        // Reset link (frontend URL where user can reset password)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'UniChat <noreply@unichat.com>',
            to: to,
            subject: 'UniChat - Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #5865F2;">Password Reset Request</h2>
                    <p>Hi ${userName},</p>
                    <p>You requested to reset your password. Click the button below to proceed:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #5865F2; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${resetUrl}">${resetUrl}</a>
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Password reset email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Send email verification email
 * 
 * @param {string} to - Recipient email
 * @param {string} verificationToken - Email verification token
 * @param {string} userName - User's name
 */
const sendEmailVerification = async (to, verificationToken, userName) => {
    try {
        const transporter = createTransporter();
        
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'UniChat <noreply@unichat.com>',
            to: to,
            subject: 'UniChat - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #5865F2;">Verify Your Email Address</h2>
                    <p>Hi ${userName},</p>
                    <p>Thank you for registering with UniChat! Please verify your email address by clicking the button below:</p>
                    <div style="margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #5865F2; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; display: inline-block;">
                            Verify Email
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Verification email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendEmailVerification
};