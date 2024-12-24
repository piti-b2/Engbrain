import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true }
    });

    if (!user) {
      // สร้างข้อมูลผู้ใช้ใหม่ถ้ายังไม่มี
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          coins: 0
        }
      });
      return NextResponse.json({ coins: newUser.coins });
    }

    return NextResponse.json({ coins: user.coins });
    
  } catch (error) {
    console.error('Error fetching user coins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
