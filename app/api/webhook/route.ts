import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CoinTransactionType, CoinTransactionReason, CoinTransactionStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  console.log('============ WEBHOOK HANDLER START ============');
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      throw new Error('Missing signature or endpoint secret');
    }

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log('Webhook event received:', {
      type: event.type,
      id: event.id,
      object: event.data.object
    });

  } catch (err: any) {
    console.error('Error verifying webhook signature:', err);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('============ PAYMENT PROCESSING START ============');
      console.log('Session data:', {
        id: session.id,
        metadata: session.metadata,
        amount_total: session.amount_total,
        payment_status: session.payment_status,
        customer: session.customer,
        client_reference_id: session.client_reference_id
      });
      
      const userId = session.metadata?.userId;
      const coinAmount = session.metadata?.coinAmount;
      
      if (!userId || !coinAmount) {
        console.error('Missing metadata:', { 
          userId, 
          coinAmount, 
          fullMetadata: session.metadata,
          sessionId: session.id
        });
        throw new Error(`Missing metadata: userId=${userId}, coinAmount=${coinAmount}`);
      }

      try {
        console.log('Starting database transaction...', {
          userId,
          coinAmount,
          sessionId: session.id
        });
        
        const result = await prisma.$transaction(async (prisma) => {
          console.log('Checking for existing transaction...');
          const existingTransaction = await prisma.transaction.findFirst({
            where: {
              userId: userId,
              amount: parseInt(coinAmount),
              type: 'payment',
              status: 'completed',
              createdAt: {
                gte: new Date(Date.now() - 5 * 60 * 1000)
              }
            }
          });

          if (existingTransaction) {
            console.log('Transaction already processed:', existingTransaction);
            return { transactionRecord: existingTransaction, user: null, coinTransaction: null };
          }

          // ตรวจสอบและเตรียมข้อมูลสำหรับ Transaction
          const paymentIntent = session.payment_intent 
            ? (typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent.id)
            : null;

          console.log('Creating transaction record...', {
            userId,
            amount: parseInt(coinAmount),
            paymentIntent,
            sessionId: session.id
          });

          const transactionRecord = await prisma.transaction.create({
            data: {
              userId: userId,
              amount: parseInt(coinAmount),
              type: 'payment',
              status: 'completed',
              stripePaymentId: paymentIntent,
              error: null // ระบุชัดเจนว่าไม่มี error
            }
          });
          console.log('Transaction record created:', transactionRecord);

          console.log('Finding or creating user...');
          let user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user) {
            console.log('Creating new user...');
            user = await prisma.user.create({
              data: {
                id: userId,
                coins: parseInt(coinAmount)
              }
            });
          } else {
            console.log('Updating existing user...');
            user = await prisma.user.update({
              where: { id: userId },
              data: {
                coins: {
                  increment: parseInt(coinAmount)
                }
              }
            });
          }
          console.log('User record updated:', user);

          console.log('Creating CoinTransaction record...');
          const coinTransaction = await prisma.coinTransaction.create({
            data: {
              userId: userId,
              amount: parseInt(coinAmount),
              type: CoinTransactionType.CREDIT,
              status: CoinTransactionStatus.COMPLETED,
              reason: CoinTransactionReason.PURCHASE,
              description: `Purchased ${coinAmount} coins via Stripe (Session: ${session.id})`,
              balance: user.coins,
              metadata: {
                stripeSessionId: session.id,
                stripePaymentIntentId: paymentIntent,
                paymentAmount: session.amount_total,
                customerEmail: session.customer_details?.email,
                customerName: session.customer_details?.name,
                paymentStatus: session.payment_status,
                transactionId: transactionRecord.id // เก็บ reference ไว้ใน metadata
              }
            }
          });
          console.log('CoinTransaction record created:', coinTransaction);

          return { transactionRecord, user, coinTransaction };
        });
        
        console.log('Database transaction completed successfully:', result);
        
        return new NextResponse(JSON.stringify({ 
          received: true,
          session: session.id,
          transaction: result.transactionRecord.id
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
        
      } catch (dbError: any) {
        console.error('Database error:', {
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
          name: dbError.name,
          stack: dbError.stack
        });
        throw new Error(`Database error: ${dbError.message}`);
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error processing webhook:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: event.type,
      eventId: event.id
    });
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
