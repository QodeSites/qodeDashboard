import nodemailer from 'nodemailer';

export const sendEmails = async (userEmail, verificationEmail, userSubject, userText, verificationSubject, verificationText, user_id, id) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "tech@qodeinvest.com",
                pass: "gnkz lwxf aexp bpri"
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://dashboard.qodeinvest.com';
        console.log(`Base URL: ${baseUrl}`);

        // Validate the base URL
        try {
            const verificationUrl = new URL(`${baseUrl}/api/verify?token=${user_id}&id=${id}`);
            const declineUrl = new URL(`${baseUrl}/api/decline?token=${user_id}&id=${id}`);
        } catch (err) {
            console.error('Invalid base URL:', baseUrl);
            throw new Error('Invalid base URL provided');
        }

        const verificationHtml = `
            <h1>New User Registration</h1>
            <p>A new user has registered and requires verification:</p>
            <p>Username: ${verificationText.username}</p>
            <p>Email: ${verificationText.email}</p>
            <p>User ID: ${user_id}</p>
            <p>
                <a href="${baseUrl}/api/verify?token=${user_id}&id=${id}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify</a>
                <a href="${baseUrl}/api/decline?token=${user_id}&id=${id}" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Decline</a>
            </p>
        `;

        const verificationMailOptions = {
            from: "tech@qodeinvest.com",
            to: verificationEmail,
            subject: verificationSubject,
            html: verificationHtml,
        };

        const userMailOptions = {
            from: "tech@qodeinvest.com",
            to: userEmail,
            subject: userSubject,
            html: userText,
        };

        await Promise.all([
            transporter.sendMail(verificationMailOptions),
            transporter.sendMail(userMailOptions)
        ]);

        console.log("Emails sent successfully");
    } catch (error) {
        console.error("Error sending emails:", error);
        throw error;
    }
}
