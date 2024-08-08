import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { sendEmails } from "@/utils/SendEmail";

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
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
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
      },
    });

    const verificationEmail = "tech@qodeinvest.com";
    const userSubject = "Welcome to Qode";
    const userText = `
      <h1>Welcome to Qode</h1>
      <p>You have successfully registered on our platform.Please wait while we verify your account.</p>
    `;

    const verificationSubject = "New User Verification Required";
    const verificationText = `
      <h1>New User Registration</h1>
      <p>A new user has registered and requires verification:</p>
      <p>Username: ${username}</p>
      <p>Email: ${email}</p>
      <p>User ID: ${user_id}</p>
      <p>Click <a href="http://localhost:3000/api/verify?token=${user_id}">here</a> to verify the user.</p>
    `;

    await sendEmails(email, verificationEmail, userSubject, userText, verificationSubject, verificationText);

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