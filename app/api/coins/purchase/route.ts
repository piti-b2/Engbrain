import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prismaClient } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { packageId } = await req.json();

    // ดึงข้อมูลแพ็คเกจ
    const coinPackage = await prismaClient.coinPackage.findUnique({
      where: { id: packageId }
    });

    if (!coinPackage) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // สร้าง transaction
    const transaction = await prismaClient.transaction.create({
      data: {
        userId,
        amount: coinPackage.coins + coinPackage.bonus,
        coinPackageId: packageId,
        type: "payment",
        status: "pending"
      }
    });

    // สร้าง Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: coinPackage.name,
              description: `${coinPackage.coins} coins + ${coinPackage.bonus} bonus coins`,
            },
            unit_amount: Number(coinPackage.price) * 100, // Convert to smallest currency unit
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coins/cancel`,
      metadata: {
        transactionId: transaction.id,
        userId,
      },
    });

    // อัปเดต transaction ด้วย Stripe Session ID
    await prismaClient.transaction.update({
      where: { id: transaction.id },
      data: { stripePaymentId: session.id }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
