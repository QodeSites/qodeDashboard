import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user_id = parseInt(token, 10);

    if (isNaN(user_id)) {
        return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    try {
        console.log("Attempting to verify user with user_id:", user_id);

        // Verify and update the user
        const user = await prisma.tblusers.updateMany({
            where: { user_id, is_verified: false },
            data: { is_verified: true }, // Optionally, add a verified_at timestamp
        });

        console.log("Update result:", user);

        if (user.count === 0) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        return NextResponse.redirect(`${process.env.APP_URL}/user-verified`);
    } catch (error) {
        console.error("Verification error:", error);

        // Log error in a more structured way and possibly to an external logging service in production
        return NextResponse.json({ error: "An error occurred during verification", details: error.message }, { status: 500 });
    }
}