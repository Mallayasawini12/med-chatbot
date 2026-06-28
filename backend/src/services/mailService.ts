import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null; // Return null to trigger local console logging fallback
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/auth?view=verify&token=${token}`;
  
  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n================================================================');
    console.log(`✉️  [SIMULATED EMAIL] Verification Email Sent to: ${email}`);
    console.log(`👤  Recipient Name: ${name}`);
    console.log(`🔗  Verification Link: ${verificationLink}`);
    console.log('================================================================\n');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@symptomcareai.com',
    to: email,
    subject: 'Verify Your Email Address - SymptomCare AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">Welcome to SymptomCare AI</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with SymptomCare AI. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">This is an automated message. Please do not reply directly.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/auth?view=reset-password&token=${token}`;
  
  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n================================================================');
    console.log(`✉️  [SIMULATED EMAIL] Password Reset Email Sent to: ${email}`);
    console.log(`👤  Recipient Name: ${name}`);
    console.log(`🔗  Password Reset Link: ${resetLink}`);
    console.log('================================================================\n');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@symptomcareai.com',
    to: email,
    subject: 'Reset Your Password - SymptomCare AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">Reset Your Password</h2>
        <p>Dear ${name},</p>
        <p>We received a request to reset your password. Please click the button below to establish a new password. This link is valid for 1 hour:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
