import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, packageId, coinAmount } = body;

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    console.log('Creating checkout session with data:', {
      userId,
      amount,
      packageId,
      coinAmount
    });

    // ดึงข้อมูลผู้ใช้จาก Clerk
    const user = await auth();
    const userEmail = user?.user?.emailAddresses?.[0]?.emailAddress;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `${coinAmount} Coins Package`,
              description: `Purchase ${coinAmount} coins for your account`,
            },
            unit_amount: amount * 100, // Convert to smallest currency unit (satang)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard/payment/success`,
      cancel_url: `${baseUrl}/dashboard/payment`,
      customer_email: userEmail, // ใช้อีเมลจาก Clerk
      metadata: {
        userId: userId,
        packageId: packageId.toString(),
        coinAmount: coinAmount.toString(),
        orderType: 'coin_purchase'
      },
    });

    console.log('Checkout session created:', {
      sessionId: checkoutSession.id,
      metadata: checkoutSession.metadata,
      url: checkoutSession.url
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('[PAYMENT_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
