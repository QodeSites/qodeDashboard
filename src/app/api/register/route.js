// app/api/register/route.js
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";
import { sendEmails } from "@/utils/SendEmail";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log("Received registration request");
    const { username, email, password } = await req.json();
    console.log("Parsed request body:", { username, email });
    const user_id = Math.floor(Math.random() * 1000000);

    // Check if user already exists
    const existingUser = await prisma.tblusers.findUnique({
      where: { email: email },
    });
    console.log("Existing user check:", existingUser ? "User exists" : "User does not exist");

    if (existingUser) {
      console.log("Registration failed: User already exists");
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const user = await prisma.tblusers.create({
      data: {
        username,
        email,
        password: hashedPassword,
        user_id,
        is_verified: false
      },
    });


    // Define the email subjects and bodies
    // In your registration route
    const verificationEmail = "tech@qodeinvest.com,purnanand.kulkarni@swancapital.in,rishabh@qodeinvest.com";
    const userSubject = "Welcome to Qode";
    const userText = `
  <h1>Welcome to Qode</h1>
  <p>You have successfully registered on our platform. Please wait while we verify your account.</p>
`;

    const verificationSubject = "New User Verification Required";
    const verificationText = {
      username,
      email
    };



    // Send the emails
    await sendEmails(email, verificationEmail, userSubject, userText, verificationSubject, verificationText, user_id, user.id);

    // Respond with success
    return NextResponse.json({ message: "User registered successfully", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
  }
}
