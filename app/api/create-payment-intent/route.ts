import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { amount, packageId } = body;

    if (!amount || isNaN(amount)) {
      return new NextResponse(JSON.stringify({ error: "Amount is required and must be a number" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get package from database
    const selectedPackage = await prisma.coinPackage.findFirst({
      where: {
        id: packageId,
        price: amount,
        is_active: true
      }
    });

    if (!selectedPackage) {
      return new NextResponse(JSON.stringify({ error: "Invalid package or amount" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const coinsAmount = selectedPackage.coins_amount;

    console.log('Creating checkout session with data:', {
      userId,
      amount,
      coinsAmount,
      packageId
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_BASE_URL is not set');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      metadata: {
        userId: userId,
        coinsAmount: coinsAmount.toString()
      },
      line_items: [{
        price_data: {
          currency: 'thb',
          product_data: {
            name: 'Engbrain Co., Ltd. Coins',
            description: `Purchase ${coinsAmount} coins`
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/payment`,
    });

    console.log('Checkout session created:', session.id);

    return new NextResponse(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new NextResponse(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
