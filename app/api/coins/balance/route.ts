import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prismaClient } from "@/lib/prisma";

export async function GET() {
  // เพิ่ม Timestamp สำหรับ Logging
  const requestTimestamp = new Date().toISOString();
  
  try {
    console.log(`[${requestTimestamp}] Coins Balance Request - Starting`);
    
    const { userId } = auth();
    console.log(`[${requestTimestamp}] Authenticated User ID: ${userId}`);

    if (!userId) {
      console.warn(`[${requestTimestamp}] Unauthorized access attempt`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      console.log(`[${requestTimestamp}] Searching for existing user with Clerk ID: ${userId}`);
      
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
        console.log(`[${requestTimestamp}] Existing user found. Coins: ${existingUser.coins}`);
        return NextResponse.json({ coins: existingUser.coins });
      }

      console.log(`[${requestTimestamp}] No existing user found. Creating new user.`);
      
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

      console.log(`[${requestTimestamp}] New user created. Initial coins: ${newUser.coins}`);
      return NextResponse.json({ coins: newUser.coins });
    
    } catch (dbError) {
      // Type guard เพื่อความปลอดภัย
      const errorMessage = dbError instanceof Error 
        ? dbError.message 
        : String(dbError);

      const errorDetails = dbError instanceof Error 
        ? {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name,
            code: (dbError as any).code
          }
        : { message: String(dbError) };

      console.error(`[${requestTimestamp}] Database Error:`, errorDetails);
      
      return NextResponse.json(
        { 
          error: "Failed to fetch or create user",
          details: errorMessage
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Type guard สำหรับ main error handler
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);

    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      : { message: String(error) };

    console.error(`[${requestTimestamp}] Unexpected Error:`, errorDetails);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}