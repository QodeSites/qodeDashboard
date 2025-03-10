// src/app/api/notify-password-change/route.js
import emailService from "@/utils/SendEmail";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const subject = "Password Reset Confirmation";
    const html = `
      <p>Dear user,</p>
      <p>Your password has been reset successfully.</p>
      <p>If you did not initiate this change, please contact our support immediately.</p>
      <p>Best regards,<br>The Qode Team</p>
    `;
    
    await emailService.sendEmail({
      to: email,
      subject,
      html
    });
    
    return NextResponse.json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    return NextResponse.json({ error: "Failed to send confirmation email." }, { status: 500 });
  }
}
