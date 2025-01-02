import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prismaClient } from '@/lib/prisma';
import { CoinTransactionType, CoinTransactionReason, CoinTransactionStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature") as string;

    if (!signature || !endpointSecret) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error('Error verifying webhook signature:', err);
      return new NextResponse('Webhook signature verification failed', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment Intent Succeeded:', {
          id: paymentIntent.id,
          metadata: paymentIntent.metadata
        });
        const metadata = paymentIntent.metadata;

        if (metadata?.userId) {
          try {
            // ตรวจสอบว่ามี user อยู่แล้วหรือไม่
            const user = await prismaClient.user.findUnique({
              where: { clerkId: metadata.userId }
            });

            // ถ้าไม่มี user ให้สร้างใหม่
            if (!user) {
              const user = await prismaClient.user.create({
                data: {
                  clerkId: metadata.userId,
                  coins: 0
                }
              });
            }

            // สร้าง Transaction record
            if (!user) {
              throw new Error('User not found');
            }
            await prismaClient.transaction.create({
              data: {
                userId: user.id,
                amount: paymentIntent.amount / 100, // ตอนนี้ TypeScript รู้ว่า user ไม่ใช่ null แล้ว
                status: 'completed',
                stripePaymentId: paymentIntent.id
              }
            });

            // Update user's coins balance
            const updatedUser = await prismaClient.user.update({
              where: { clerkId: metadata.userId },
              data: {
                coins: {
                  increment: metadata.coins ? parseInt(metadata.coins) : 0
                }
              }
            });

            // สร้าง CoinTransaction record
            await prismaClient.coinTransaction.create({
              data: {
                userId: updatedUser.id,
                amount: metadata.coins ? parseInt(metadata.coins) : 0,
                type: CoinTransactionType.CREDIT,
                reason: CoinTransactionReason.PURCHASE,
                status: CoinTransactionStatus.COMPLETED,
                balance: updatedUser.coins
              }
            });
          } catch (error) {
            console.error('Error processing payment intent success:', error);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        const error = paymentIntent.last_payment_error;

        console.log('Payment Intent Failed:', {
          id: paymentIntent.id,
          metadata: metadata,
          error: error
        });

        if (metadata?.userId) {
          try {
            // ตรวจสอบว่ามี user อยู่แล้วหรือไม่
            let user = await prismaClient.user.findUnique({
              where: { clerkId: metadata.userId }
            });

            if (!user) {
              user = await prismaClient.user.create({
                data: {
                  clerkId: metadata.userId,
                  coins: 0
                }
              });
            }

            // สร้าง Transaction record สำหรับการชำระเงินที่ล้มเหลว
            await prismaClient.transaction.create({
              data: {
                userId: user.id,
                amount: paymentIntent.amount / 100,
                status: 'failed',
                stripePaymentId: paymentIntent.id,
                error: error?.message || 'Payment failed',
                errorCode: error?.code,
                failureMessage: error?.message
              }
            });

            console.log('Created failed transaction record for user:', user.id);
          } catch (error) {
            console.error('Error processing payment intent failure:', error);
            return new NextResponse('Error processing webhook', { status: 500 });
          }
        }
        break;
      }

      case 'payment_intent.created': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment Intent Created:', {
          id: paymentIntent.id,
          metadata: paymentIntent.metadata
        });
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        
        if (paymentIntentId) {
          try {
            // อัพเดท Transaction ที่มีอยู่แล้ว (ถ้ามี)
            await prismaClient.transaction.updateMany({
              where: {
                stripePaymentId: paymentIntentId
              },
              data: {
                status: 'failed',
                error: charge.failure_message || 'Charge failed',
                errorCode: charge.failure_code,
                failureMessage: charge.failure_message
              }
            });
          } catch (error) {
            console.error('Error processing charge failure:', error);
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, coinAmount } = session.metadata || {};

        if (!userId || !coinAmount) {
          console.error('Missing userId or coinAmount in session metadata');
          return new NextResponse('Missing metadata', { status: 400 });
        }

        try {
          const result = await prismaClient.$transaction(async (prisma) => {
            console.log('Finding or creating user...');
            let user = await prisma.user.findUnique({
              where: { clerkId: userId }
            });

            if (!user) {
              console.log('Creating new user...');
              user = await prisma.user.create({
                data: {
                  clerkId: userId,
                  coins: 0
                }
              });
            }

            console.log('User record:', user);

            // อัพเดทจำนวนเหรียญของ user
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                coins: {
                  increment: parseInt(coinAmount)
                }
              }
            });

            console.log('User record updated:', user);

            console.log('Checking for existing transaction...');
            const existingTransaction = await prisma.transaction.findFirst({
              where: {
                userId: user.id,
                amount: parseInt(coinAmount),
                status: 'completed',
                stripePaymentId: session.payment_intent as string
              }
            });

            if (existingTransaction) {
              console.log('Transaction already exists:', existingTransaction);
              return {
                user,
                transaction: existingTransaction,
                coinTransaction: null
              };
            }

            console.log('Creating transaction record...');
            const transactionRecord = await prisma.transaction.create({
              data: {
                userId: user.id,
                amount: parseInt(coinAmount),
                status: 'completed',
                stripePaymentId: session.payment_intent as string
              }
            });

            console.log('Transaction record created:', transactionRecord);

            console.log('Creating CoinTransaction record...');
            const coinTransaction = await prisma.coinTransaction.create({
              data: {
                userId: user.id,
                amount: parseInt(coinAmount),
                type: CoinTransactionType.CREDIT,
                reason: CoinTransactionReason.PURCHASE,
                status: CoinTransactionStatus.COMPLETED,
                balance: user.coins + parseInt(coinAmount)
              }
            });

            console.log('CoinTransaction created:', coinTransaction);

            return { user, transaction: transactionRecord, coinTransaction };
          });

          console.log('Transaction completed successfully:', result);
        } catch (error) {
          console.error('Error processing checkout session completion:', error);
          return new NextResponse('Error processing webhook', { status: 500 });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook error', { status: 500 });
  }
}
