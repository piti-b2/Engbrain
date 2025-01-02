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

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the package
    const selectedPackage = await prismaClient.coinPackage.findFirst({
      where: {
        id: packageId,
        active: true
      }
    });

    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Package not found or inactive" },
        { status: 404 }
      );
    }

    const coins = selectedPackage.coins;

    console.log('Creating checkout session with data:', {
      userId,
      packageId,
      amount: selectedPackage.price,
      coins
    });

    // Create Checkout Sessions from body params.
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card", "promptpay"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: selectedPackage.name,
            },
            unit_amount: Number(selectedPackage.price) * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        coinAmount: coins.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payment?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payment?canceled=true`,
    };

    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create(params);

    return NextResponse.json(checkoutSession);
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
