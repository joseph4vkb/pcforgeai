import nodemailer from "nodemailer";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

async function getTransporter() {
  const config = await db.adminConfig.findFirst();

  if (!config || !config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SMTP configuration is not set up. Please configure email settings in admin panel.",
    });
  }

  // Port 587 uses STARTTLS (starts unencrypted, then upgrades to TLS)
  // Port 465 uses implicit TLS (encrypted from the start)
  // If port 587 is used, we must set secure: false and use requireTLS
  const isPort587 = config.smtpPort === 587;
  const useSecure = isPort587 ? false : config.smtpSecure;

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: useSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
    // Explicit TLS configuration to handle STARTTLS and avoid SSL version issues
    requireTLS: isPort587 ? true : config.smtpSecure,
    tls: {
      // Don't fail on invalid certs in development, but this should be true in production
      rejectUnauthorized: true,
      // Minimum TLS version to avoid old SSL protocols
      minVersion: 'TLSv1.2',
    },
  });
}

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const transporter = await getTransporter();
  const verificationLink = `${baseUrl}/verify-email/${token}`;

  await transporter.sendMail({
    from: (await db.adminConfig.findFirst())?.smtpUser ?? undefined,
    to: email,
    subject: "Verify Your Email - PC Builder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to PC Builder!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const transporter = await getTransporter();
  const resetLink = `${baseUrl}/reset-password/${token}`;

  await transporter.sendMail({
    from: (await db.adminConfig.findFirst())?.smtpUser ?? undefined,
    to: email,
    subject: "Reset Your Password - PC Builder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${resetLink}</p>
        <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
          This link will expire in 1 hour.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendTestEmail(toEmail: string) {
  const transporter = await getTransporter();
  const config = await db.adminConfig.findFirst();

  await transporter.sendMail({
    from: config?.smtpUser ?? undefined,
    to: toEmail,
    subject: "Test Email - PC Builder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">SMTP Configuration Test</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #059669; font-weight: bold;">✓ Success!</p>
          <p style="margin: 8px 0 0 0; color: #6b7280;">Your email settings are configured properly and emails can be sent from your PC Builder application.</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated test email from PC Builder Admin Panel.
        </p>
      </div>
    `,
  });
}
