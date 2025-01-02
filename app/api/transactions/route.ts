import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prismaClient } from '@/lib/prisma';
import logger from '@/lib/logger';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      logger.logWarning('No userId found in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.logInfo('Fetching transactions for user', { userId });
    
    try {
      // Check if user exists and update profile if needed
      const dbUser = await prismaClient.user.findUnique({
        where: { clerkId: userId }
      });

      if (!dbUser) {
        logger.logInfo('Creating new user', { 
          clerkId: userId,
          email: auth()?.user?.emailAddresses?.[0]?.emailAddress,
          name: auth()?.user?.firstName ? `${auth()?.user?.firstName} ${auth()?.user?.lastName || ''}`.trim() : undefined
        });
        
        const newUser = await prismaClient.user.create({
          data: {
            clerkId: userId,
            email: auth()?.user?.emailAddresses?.[0]?.emailAddress,
            name: auth()?.user?.firstName ? `${auth()?.user?.firstName} ${auth()?.user?.lastName || ''}`.trim() : undefined,
            coins: 0
          }
        });
        
        const transactions = await prismaClient.transaction.findMany({
          where: {
            userId: newUser.id,
            type: 'payment',
            status: 'completed'
          },
          include: {
            coinPackage: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return NextResponse.json(transactions);
      }
      
      if (dbUser && (!dbUser.email || !dbUser.name)) {
        // Update user profile if email or name is missing
        logger.logInfo('Updating user profile', { userId });
        await prismaClient.user.update({
          where: { clerkId: userId },
          data: {
            email: auth()?.user?.emailAddresses?.[0]?.emailAddress || dbUser.email,
            name: auth()?.user?.firstName ? `${auth()?.user?.firstName} ${auth()?.user?.lastName || ''}`.trim() : dbUser.name
          }
        });
      }

      const transactions = await prismaClient.transaction.findMany({
        where: {
          userId: dbUser.id,
          type: 'payment',
          status: 'completed'
        },
        include: {
          coinPackage: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Format transactions
      const formattedTransactions = transactions.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        createdAt: new Date(tx.createdAt).toISOString(),
        updatedAt: new Date(tx.updatedAt).toISOString()
      }));

      logger.logInfo('Successfully fetched transactions', { 
        userId, 
        count: formattedTransactions.length 
      });
      
      return NextResponse.json(formattedTransactions);

    } catch (dbError) {
      logger.logError('Database error:', dbError);
      throw dbError;
    }

  } catch (error: unknown) {
    logger.logError('Error in transactions API:', error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Database constraint violation',
          details: error.message 
        }, { status: 409 });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}
