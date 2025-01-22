import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendResetPasswordEmail } from "@/lib/email";
import { addMinutes } from "date-fns";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user_master.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const token = uuidv4(); // Generate unique token
    const expiresAt = addMinutes(new Date(), 15); // Token expires in 15 minutes

    await prisma.user_master.update({
      where: { id: user.id },
      data: { reset_token: token, reset_expires: expiresAt },
    });

    await sendResetPasswordEmail(user.email, token);

    return NextResponse.json({ message: "Password reset link sent" }, { status: 200 });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
