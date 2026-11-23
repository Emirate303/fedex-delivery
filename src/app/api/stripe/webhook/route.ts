import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing.");

    return NextResponse.json(
      { error: "Webhook configuration is incomplete." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    if (
      session.mode !== "payment" ||
      session.payment_status !== "paid"
    ) {
      return NextResponse.json({ received: true });
    }

    const paymentId = session.metadata?.paymentId;
    const shipmentId = session.metadata?.shipmentId;

    if (!paymentId || !shipmentId || !session.id) {
      console.error("Stripe session is missing required metadata.");

      return NextResponse.json(
        { error: "Invalid payment metadata." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { shipment: true },
      });

      if (!payment || payment.shipmentId !== shipmentId) {
        throw new Error("Payment or shipment record does not match.");
      }

      if (payment.status === "PAID") {
        return;
      }

      if (!["PENDING", "FAILED"].includes(payment.status)) {
        throw new Error("Payment is not eligible for confirmation.");
      }

      const expectedAmount = Math.round(
        Number(payment.amount) * 100
      );

      if (
        session.amount_total !== expectedAmount ||
        session.currency?.toLowerCase() !==
          payment.currency.toLowerCase()
      ) {
        throw new Error("Stripe payment amount or currency mismatch.");
      }

      const updated = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: {
            in: ["PENDING", "FAILED"],
          },
        },
        data: {
          status: "PAID",
          reference: session.id,
        },
      });

      if (updated.count === 0) {
        return;
      }

      await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "CONFIRMED",
        },
      });

      await tx.trackingEvent.create({
        data: {
          shipmentId,
          status: "CONFIRMED",
          location: payment.shipment.senderCity,
          description: "Payment successfully verified. Shipment confirmed.",
        },
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}