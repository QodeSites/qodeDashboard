import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, token, password } = body;
    console.log(email, token, password);
    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Email, token, and new password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user_master.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      !user.reset_token ||
      !user.reset_expires ||
      user.reset_token !== token ||
      new Date() > user.reset_expires
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user: set the new password and clear reset token fields
    await prisma.user_master.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_expires: null,
      },
    });

    return NextResponse.json({
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
