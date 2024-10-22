import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import emailService from "@/utils/SendEmail";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const id = searchParams.get('id');

    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user_id = parseInt(token, 10);

    if (isNaN(user_id)) {
        return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    try {
        console.log("Attempting to verify user with user_id:", user_id);

        // Fetch the user by id first
        const user = await prisma.tblusers.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user_id matches and user is not verified
        if (user.user_id !== user_id || user.is_verified) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // Update user to verified
        const updatedUser = await prisma.tblusers.update({
            where: { id: user.id },
            data: { is_verified: true },
        });

        console.log("User verification successful:", updatedUser);

        // Send verification confirmation email
        try {
            await emailService.sendEmail({
                to: user.email,
                ...emailService.getVerificationConfirmationTemplate(user.username)
            });
            console.log("Verification confirmation email sent successfully");
        } catch (emailError) {
            // Log email error but don't fail the verification process
            console.error("Failed to send verification confirmation email:", emailError);
        }

        // Redirect user to success page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/user-verified`);
    } catch (error) {
        console.error("Verification error:", error);

        if (error.code === "P2025") {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        return NextResponse.json({
            error: "An error occurred during verification",
            details: error.message
        }, { status: 500 });
    }
}