import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prismaClient } from "../../../../lib/prisma";
import { CoinTransactionType, CoinTransactionReason, CoinTransactionStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { transactionId, userId } = session.metadata!;

      // อัปเดตสถานะ transaction
      const transaction = await prismaClient.transaction.update({
        where: { id: transactionId },
        data: { 
          status: "completed",
          updatedAt: new Date()
        },
        include: {
          coinPackage: true
        }
      });

      if (!transaction.coinPackage) {
        throw new Error("Coin package not found");
      }

      // เพิ่มเหรียญให้ user
      await prismaClient.user.update({
        where: { id: userId },
        data: {
          coins: {
            increment: transaction.amount
          }
        }
      });

      // บันทึก coin transaction
      const user = await prismaClient.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      await prismaClient.coinTransaction.create({
        data: {
          userId,
          amount: transaction.amount,
          type: CoinTransactionType.CREDIT,
          reason: CoinTransactionReason.PURCHASE,
          status: CoinTransactionStatus.COMPLETED,
          balance: (user.coins || 0) + transaction.amount,
          metadata: {
            transactionId: transaction.id
          }
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
