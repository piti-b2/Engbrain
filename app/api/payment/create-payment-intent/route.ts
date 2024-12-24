import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, packageId } = await req.json();

    console.log('Creating payment intent:', {
      amount,
      packageId,
      userId
    });

    // สร้าง payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'thb',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'coin_purchase',
        userId: userId,
        packageId: packageId.toString(),
      },
    });

    console.log('Payment intent created:', {
      id: paymentIntent.id,
      metadata: paymentIntent.metadata
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
}
