import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'tech@qodeinvest.com',
                pass: process.env.SMTP_PASSWORD
            }
        });

        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://dashboard.qodeinvest.com';

        // Define base email template with styles
        this.emailStyles = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Playfair+Display:wght@400;700&display=swap');
            body {
                font-family: 'DM Sans', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                background-color: #ffffff;
                max-width: 600px;
                margin: 30px auto;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                background-color: #ffffff;
                color: #d1a47b;
                padding: 10px;
                text-align: center;
                font-family: 'Playfair Display', serif;
                font-size: 24px;
                font-weight: 700;
            }
            .email-content {
                margin: 20px 0;
            }
            .email-content p {
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
            }
            .email-footer {
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #777777;
            }
            .cta-button {
                background-color: #d1a47b;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-top: 20px;
            }
            .cta-button:hover {
                background-color: #7a4e30;
            }
            .cta-button:active {
                color: white;
            }
        `;
    }

    wrapWithTemplate(content, title) {
        return `
            <html>
                <head>
                    <style>${this.emailStyles}</style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="email-content">
                            ${content}
                        </div>
                        <div class="email-footer">
                            © ${new Date().getFullYear()} Qode. All rights reserved.
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    async sendEmail(options) {
        try {
            const result = await this.transporter.sendMail({
                from: 'tech@qodeinvest.com',
                ...options,
                html: this.wrapWithTemplate(options.html, options.subject)
            });
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    getAdminNotificationTemplate(userData) {
        const { username, email, user_id, id } = userData;
        return {
            subject: 'New User Verification Required',
            html: `
                <p>A new user has registered and requires verification:</p>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>User ID:</strong> ${user_id}</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${this.baseUrl}/api/verify?token=${user_id}&id=${id}" 
                       class="cta-button" style="margin-right: 10px;color: white; text-decoration: none;">
                       Verify User
                    </a>
                    <a href="${this.baseUrl}/api/decline?token=${user_id}&id=${id}" 
                       class="cta-button" style="background-color: #f44336;color: white; text-decoration: none;">
                       Decline User
                    </a>
                </div>
            `
        };
    }

    getUserWelcomeTemplate(username) {
        return {
            subject: 'Welcome to Qode',
            html: `
                <p>Dear ${username},</p>
                <p>Thank you for registering with Qode. Your account is currently under review by our team.</p>
                <p>You will receive a notification once your account has been verified.</p>
                <p style="margin-top: 20px;">Best regards,<br>The Qode Team</p>
            `
        };
    }

    getVerificationConfirmationTemplate(username) {
        return {
            subject: 'Account Verified - Welcome to Qode',
            html: `
                <p>Dear ${username},</p>
                <p>Congratulations! Your Qode account has been successfully verified.</p>
                <p>You can now access dashboard.</p>
                <div style="text-align: center;">
                    <a style="color: white; text-decoration: none;margin-bottom: 10px;" href="${this.baseUrl}" class="cta-button">
                        Login to Dashboard
                    </a>
                </div>
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team at 
                    <a href="mailto:operations@qodeinvest.com" style="color: #1a73e8;">operations@qodeinvest.com</a>.
                </p>
                <p style="margin-top: 20px;">Best regards,<br>The Qode Team</p>
            `
        };
    }
}

const emailService = new EmailService();
export default emailService;