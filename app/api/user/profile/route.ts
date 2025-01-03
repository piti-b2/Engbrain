import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prismaClient } from "../../../../lib/prisma";

export async function POST(request: Request) {
  console.log('API: Starting user profile endpoint');
  
  try {
    // Get authenticated user
    const { userId } = auth();
    console.log('API: Auth check - User ID:', userId);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('API: Request body:', body);

    // Validate request body
    if (!body.userId || body.userId !== userId) {
      return new NextResponse("Invalid user ID", { status: 400 });
    }

    // Create or update user profile
    const user = await prismaClient.user.upsert({
      where: { 
        clerkId: userId 
      },
      update: {
        email: body.email,
        name: body.name,
        updatedAt: new Date()
      },
      create: {
        clerkId: userId,
        email: body.email,
        name: body.name,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    console.log('API: User upserted successfully:', user);

    return NextResponse.json(user);
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
