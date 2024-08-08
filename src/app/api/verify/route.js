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
        const user = await prisma.tblusers.updateMany({
            where: { user_id: user_id, is_verified: false },
            data: { is_verified: true },
        });

        console.log("Update result:", user);

        if (user.count === 0) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        return (
            <div>
                <h1>User verified successfully</h1>
            </div>
        )
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "An error occurred during verification", details: error.message }, { status: 500 });
    }
}