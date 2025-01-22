import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  const session = await getServerSession( authOptions );
    console.log(session);
    
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await prisma.client_master.findMany({
      where: { user_id: parseInt(session.user.id) },
      select: { nuvama_code: true, username: true },
    });
    console.log('accounts',accounts);
    
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}