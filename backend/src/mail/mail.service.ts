import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn(
        "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send email.",
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      requireTLS: !env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });

    this.logger.log(`SMTP ready (${env.smtp.host}:${env.smtp.port} as ${env.smtp.user})`);
  }

  isConfigured(): boolean {
    return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
  }

  async sendMail(input: SendMailInput): Promise<void> {
    if (!this.transporter || !this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
      );
    }

    const fromAddress = env.smtp.from || env.smtp.user;
    const from = fromAddress.includes("<") ? fromAddress : `"Safety Circle" <${fromAddress}>`;

    try {
      await this.transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.error(`Failed to send email to ${input.to}: ${detail}`);
      if (/invalid login|badcredentials|535/i.test(detail)) {
        throw new ServiceUnavailableException(
          "SMTP login failed. Check SMTP_USER and SMTP_PASS. Gmail requires an App Password, not the account password.",
        );
      }
      throw new ServiceUnavailableException("Failed to send email. Please try again shortly.");
    }
  }

  async sendPasswordResetOtp(to: string, code: string, expiresInMinutes: number): Promise<void> {
    const subject = "Your Safety Circle password reset code";
    const text = [
      `Your Safety Circle verification code is ${code}.`,
      `This code expires in ${expiresInMinutes} minutes.`,
      "If you did not request a password reset, you can ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Your Safety Circle verification code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p style="color: #6b7280;">If you did not request a password reset, you can ignore this email.</p>
      </div>
    `;
    await this.sendMail({ to, subject, text, html });
  }

  async sendEmailVerificationOtp(to: string, code: string, expiresInMinutes: number): Promise<void> {
    const subject = "Your Safety Circle email verification code";
    const text = [
      `Your Safety Circle email verification code is ${code}.`,
      `This code expires in ${expiresInMinutes} minutes.`,
      "If you did not create a Safety Circle account, you can ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Your Safety Circle email verification code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p style="color: #6b7280;">If you did not create a Safety Circle account, you can ignore this email.</p>
      </div>
    `;
    await this.sendMail({ to, subject, text, html });
  }

  async sendPinResetOtp(to: string, code: string, expiresInMinutes: number): Promise<void> {
    const subject = "Your Safety Circle PIN reset code";
    const text = [
      `Your Safety Circle PIN reset code is ${code}.`,
      `This code expires in ${expiresInMinutes} minutes.`,
      "If you did not request a PIN reset, you can ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Your Safety Circle PIN reset code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p style="color: #6b7280;">If you did not request a PIN reset, you can ignore this email.</p>
      </div>
    `;
    await this.sendMail({ to, subject, text, html });
  }
}
