// src/app/api/auth/forgot-password/route.js
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user_master.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond with the same message to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists for that email, a reset link has been sent.",
      });
    }

    // Generate a secure token (32 bytes hex string)
    const token = crypto.randomBytes(32).toString("hex");

    // Set token expiration to 1 hour from now
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    // Update the user with the reset token and expiration
    await prisma.user_master.update({
      where: { email: normalizedEmail },
      data: {
        reset_token: token,
        reset_expires: expiration,
      },
    });

    // Use your external email API endpoint to send the forgot password email.
    // Ensure FORGOT_PASSWORD_API_URL is defined in your environment variables or fallback to the default.
    const forgotPasswordApiUrl =
      process.env.FORGOT_PASSWORD_API_URL ||
      "https://api.qodeinvestments.com/api/emails/forgot-password";

    const forgotPasswordResponse = await fetch(forgotPasswordApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: normalizedEmail,
        token: token,
      }),
    });

    // If the external API call fails, log the error but still return the generic message.
    if (!forgotPasswordResponse.ok) {
      const errorData = await forgotPasswordResponse.json();
      console.error("Error sending forgot password email:", errorData);
      // Return the same generic message to prevent information leakage.
      return NextResponse.json({
        message:
          "If an account exists for that email, a reset link has been sent.",
      });
    }

    return NextResponse.json({
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
