import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      // ค้นหา user ที่มีอยู่แล้ว
      const existingUser = await prismaClient.user.findUnique({
        where: {
          clerkId: userId
        },
        select: {
          coins: true
        }
      });

      if (existingUser) {
        return NextResponse.json({ coins: existingUser.coins });
      }

      // ถ้าไม่มี user ให้สร้างใหม่
      const newUser = await prismaClient.user.create({
        data: {
          clerkId: userId,
          coins: 0
        },
        select: {
          coins: true
        }
      });

      return NextResponse.json({ coins: newUser.coins });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch or create user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in /api/coins/balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
