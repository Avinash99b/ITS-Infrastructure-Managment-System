import nodemailer from 'nodemailer';
import logger from './logger';
import "dotenv/config"

export interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

class Mailer {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendMail(options: MailOptions) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                ...options,
            });
            logger.info('Mail sent', { to: options.to, subject: options.subject });
        } catch (err) {
            logger.error('Failed to send mail', { error: err, to: options.to });
            throw err;
        }
    }
}

export default new Mailer();

