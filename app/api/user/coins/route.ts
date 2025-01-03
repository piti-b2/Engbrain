import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { prismaClient } from "../../../../lib/prisma";
import logger from '../../../../lib/logger';

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();
    
    if (!userId) {
      logger.logWarning('No userId found in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.logInfo('Fetching coins for user', { userId });

    try {
      let dbUser = await prismaClient.user.findUnique({
        where: { clerkId: userId },
        select: { coins: true, email: true, name: true }
      });

      if (!dbUser) {
        logger.logInfo('Creating new user', { 
          userId,
          email: user?.emailAddresses[0]?.emailAddress,
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined
        });
        
        dbUser = await prismaClient.user.create({
          data: {
            clerkId: userId,
            email: user?.emailAddresses[0]?.emailAddress,
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
            coins: 0
          }
        });
      } else if (!dbUser.email || !dbUser.name) {
        // Update user profile if email or name is missing
        logger.logInfo('Updating user profile', { userId });
        dbUser = await prismaClient.user.update({
          where: { clerkId: userId },
          data: {
            email: user?.emailAddresses[0]?.emailAddress || dbUser.email,
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : dbUser.name
          }
        });
      }

      logger.logInfo('Successfully fetched user coins', { 
        userId, 
        coins: dbUser.coins,
        email: dbUser.email,
        name: dbUser.name
      });
      
      return NextResponse.json({ coins: dbUser.coins });

    } catch (dbError) {
      logger.logError('Database error:', dbError);
      throw dbError;
    }
    
  } catch (error) {
    logger.logError('Error fetching user coins:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
