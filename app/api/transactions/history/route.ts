import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { CoinTransactionService } from '@/services/coinTransactionService';

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // รับ query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    console.log('Fetching transactions for user:', userId);
    console.log('Page:', page, 'Limit:', limit);

    // ดึงประวัติธุรกรรม
    const history = await CoinTransactionService.getTransactionHistory(
      userId,
      page,
      limit
    );

    console.log('Successfully fetched transactions:', history);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Detailed error in transaction history:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
