// app/api/register/route.js
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";
import emailService from "@/utils/SendEmail";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    // Generate user_id
    const user_id = Math.floor(Math.random() * 1000000);

    // Check for existing user
    const existingUser = await prisma.tblusers.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      console.log("Registration failed: User already exists");
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 10);
    const user = await prisma.tblusers.create({
      data: {
        username,
        email,
        password: hashedPassword,
        user_id,
        is_verified: false
      },
    });

    // Send emails
    try {
      // 1. Send admin notification
      const adminEmails = [
        'tech@qodeinvest.com',
        'purnanand.kulkarni@swancapital.in',
        'rishabh@qodeinvest.com'
      ];

      const adminTemplate = emailService.getAdminNotificationTemplate({
        username,
        email,
        user_id,
        id: user.id
      });

      await emailService.sendEmail({
        to: adminEmails.join(','),
        ...adminTemplate
      });

      // 2. Send user welcome email
      const userTemplate = emailService.getUserWelcomeTemplate(username);
      await emailService.sendEmail({
        to: email,
        ...userTemplate
      });

    } catch (emailError) {
      console.error("Error sending registration emails:", emailError);
      // Continue with registration even if emails fail
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}