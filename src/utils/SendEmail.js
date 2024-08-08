import nodemailer from 'nodemailer';

export const sendEmails = async (userEmail, verificationEmail, userSubject, userText, verificationSubject, verificationText) => {
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

        const verificationMailOptions = {
            from: "tech@qodeinvest.com",
            to: verificationEmail,
            subject: verificationSubject,
            html: verificationText,
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