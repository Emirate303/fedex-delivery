import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trackingNumber = body.trackingNumber;

    if (
      typeof trackingNumber !== "string" ||
      !trackingNumber.trim()
    ) {
      return NextResponse.json(
        { error: "A valid tracking number is required." },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: {
        trackingNumber: trackingNumber.trim(),
      },
      include: {
        payment: true,
      },
    });

    if (!shipment || !shipment.payment) {
      return NextResponse.json(
        { error: "Shipment or payment record not found." },
        { status: 404 }
      );
    }

    const payment = shipment.payment;

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "This shipment has already been paid." },
        { status: 409 }
      );
    }

    if (!["PENDING", "FAILED"].includes(payment.status)) {
      return NextResponse.json(
        { error: "This payment cannot currently be processed." },
        { status: 400 }
      );
    }

    const amount = Math.round(Number(payment.amount) * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",


      line_items: [
        {
          price_data: {
            currency: payment.currency.toLowerCase(),
           product_data: {
  name: `Shipping Service - ${shipment.trackingNumber}`,
  description: "Shipment delivery service",
},
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      client_reference_id: payment.id,

      metadata: {
        paymentId: payment.id,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      },

      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${origin}/tracking`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 500 }
    );
  }
}