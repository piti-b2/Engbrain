import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      console.log('No userId found in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching transactions for user:', userId);
    
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.error('User not found:', userId);
        // สร้างข้อมูลผู้ใช้ใหม่ถ้ายังไม่มี
        await prisma.user.create({
          data: {
            id: userId,
            coins: 0
          }
        });
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          type: true
        }
      });

      console.log('Raw transactions:', JSON.stringify(transactions, null, 2));
      
      // Format transactions to match the Transaction interface
      const formattedTransactions = transactions.map((tx: {
        id: string;
        amount: number;
        status: string;
        createdAt: Date;
        type: string;
      }) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        createdAt: new Date(tx.createdAt).toISOString(),
      }));

      console.log('Formatted transactions:', JSON.stringify(formattedTransactions, null, 2));
      
      return new NextResponse(JSON.stringify(formattedTransactions), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (dbError: any) {
      console.error('Database error:', dbError);
      console.error('Error stack:', dbError.stack);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      throw dbError;
    }

  } catch (error: any) {
    console.error('Error in transactions API:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Return appropriate error response
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Database constraint violation',
        details: error.message 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
