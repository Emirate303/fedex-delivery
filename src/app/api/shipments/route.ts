
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { checkShipmentRateLimit } from "@/lib/rate-limit";

import {
  sendShipmentCreatedEmail,
  sendSenderShipmentConfirmationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

// Server-controlled shipping services.
const SHIPPING_SERVICES = {
  EXPRESS: {
    name: "Express Delivery",
    price: 39.99,
    days: 2,
  },
  STANDARD: {
    name: "Standard Delivery",
    price: 19.99,
    days: 5,
  },
  INTERNATIONAL: {
    name: "International Delivery",
    price: 59.99,
    days: 10,
  },
} as const;

// Customer contact validation.
const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),

  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),

  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^\+?[\d\s().-]+$/, "Invalid phone number."),

  address: z.string().trim().min(3).max(250),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).nullish(),
  postalCode: z.string().trim().max(30).nullish(),
  country: z.string().trim().min(2).max(100),
});

// Package validation.
const packageSchema = z.object({
  description: z.string().trim().min(3).max(500),
  weight: z.number().finite().positive().max(10000),
  length: z.number().finite().positive().max(10000),
  width: z.number().finite().positive().max(10000),
  height: z.number().finite().positive().max(10000),
});

// Complete shipment request validation.
const shipmentSchema = z.object({
  sender: contactSchema,
  recipient: contactSchema,
  package: packageSchema,
  serviceCode: z.enum([
    "EXPRESS",
    "STANDARD",
    "INTERNATIONAL",
  ]),
});

type ShipmentWithRelations = Prisma.ShipmentGetPayload<{
  include: {
    package: true;
    trackingEvents: true;
    payment: true;
  };
}>;

// Standardized shipment response.
function shipmentResponse(
  shipment: Pick<
    ShipmentWithRelations,
    | "id"
    | "trackingNumber"
    | "status"
    | "serviceName"
    | "shippingPrice"
    | "estimatedDelivery"
    | "payment"
  >,
  message: string,
  emailSent: boolean,
  senderEmailSent: boolean,
  statusCode: number
) {
  return NextResponse.json(
    {
      success: true,
      message,
      emailSent,
      senderEmailSent,

      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        service: shipment.serviceName,
        shippingPrice: shipment.shippingPrice.toString(),
        currency: "USD",
        estimatedDelivery: shipment.estimatedDelivery,
        paymentStatus: shipment.payment?.status,
      },
    },
    { status: statusCode }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Require an idempotency key from the shipping form.
    const rawIdempotencyKey = request.headers.get("Idempotency-Key");

    if (
      !rawIdempotencyKey ||
      !/^[A-Za-z0-9._:-]{16,128}$/.test(rawIdempotencyKey)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid shipment request key is required. Please refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    // Hash the key before storing it in the database.
    const idempotencyKey = createHash("sha256")
      .update(rawIdempotencyKey)
      .digest("hex");

    // Check whether this request already created a shipment.
    const existingShipment = await prisma.shipment.findUnique({
      where: {
        idempotencyKey,
      },
      include: {
        payment: true,
      },
    });

    if (existingShipment) {
      return shipmentResponse(
        existingShipment,
        "This shipment was already created for this request.",
        false,
        false,
        200
      );
    }

    // Rate limiting for new shipment requests.
    let rateLimit;

    try {
      rateLimit = await checkShipmentRateLimit(request);
    } catch (error) {
      console.error("Shipment rate-limit service error:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Shipment service is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (!rateLimit.success) {
      if (!rateLimit.configured) {
        return NextResponse.json(
          {
            success: false,
            message: "Shipment protection is not configured.",
          },
          { status: 503 }
        );
      }

      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.reset - Date.now()) / 1000)
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Too many shipment submissions. Please try again later.",
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // Parse JSON safely.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request.",
        },
        { status: 400 }
      );
    }

    // Validate incoming data.
    const validation = shipmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your shipment information.",
          errors: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      sender,
      recipient,
      package: packageDetails,
      serviceCode,
    } = validation.data;

    // Retrieve trusted server-side shipping information.
    const service = SHIPPING_SERVICES[serviceCode];

    // Generate tracking number.
    const trackingNumber = `FDL${randomBytes(8)
      .toString("hex")
      .toUpperCase()}`;

    // Calculate estimated delivery.
    const estimatedDelivery = new Date();

    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + service.days
    );

    // Create shipment and related records atomically.
    let shipment: ShipmentWithRelations;

    try {
      shipment = await prisma.shipment.create({
        data: {
          trackingNumber,
          idempotencyKey,

          senderName: sender.name,
          senderEmail: sender.email,
          senderPhone: sender.phone,
          senderAddress: sender.address,
          senderCity: sender.city,
          senderState: sender.state || null,
          senderPostal: sender.postalCode || null,
          senderCountry: sender.country,

          recipientName: recipient.name,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          recipientAddress: recipient.address,
          recipientCity: recipient.city,
          recipientState: recipient.state || null,
          recipientPostal: recipient.postalCode || null,
          recipientCountry: recipient.country,

          description: packageDetails.description,
          weight: packageDetails.weight,
          length: packageDetails.length,
          width: packageDetails.width,
          height: packageDetails.height,

          serviceCode,
          serviceName: service.name,
          shippingPrice: service.price,

          estimatedDelivery,

          package: {
            create: {
              description: packageDetails.description,
              weight: packageDetails.weight,
              length: packageDetails.length,
              width: packageDetails.width,
              height: packageDetails.height,
            },
          },

          trackingEvents: {
            create: {
              status: "PENDING",
              location: sender.city,
              description: "Shipment information received.",
            },
          },

          payment: {
            create: {
              amount: service.price,
              currency: "USD",
              status: "PENDING",
            },
          },
        },

        include: {
          package: true,
          trackingEvents: true,
          payment: true,
        },
      });
    } catch (error) {
      // Handle simultaneous requests using the same key.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicateShipment = await prisma.shipment.findUnique({
          where: {
            idempotencyKey,
          },
          include: {
            payment: true,
          },
        });

        if (duplicateShipment) {
          return shipmentResponse(
            duplicateShipment,
            "This shipment was already created for this request.",
            false,
            false,
            200
          );
        }

        return NextResponse.json(
          {
            success: false,
            message:
              "Your shipment request is still being processed. Please try again using the same request.",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    // Send recipient notification email.
    let emailSent = false;
    let senderEmailSent = false;

    try {
      const emailResult = await sendShipmentCreatedEmail({
        recipientEmail: shipment.recipientEmail,
        recipientName: shipment.recipientName,
        senderName: shipment.senderName,
        trackingNumber: shipment.trackingNumber,
        serviceName: shipment.serviceName,
        estimatedDelivery: shipment.estimatedDelivery!,
      });

      if (emailResult.error) {
        console.error(
          "Recipient confirmation email failed:",
          emailResult.error
        );
      } else {
        emailSent = true;
      }
    } catch (error) {
      console.error("Recipient email error:", error);
    }

    // Send sender confirmation email.
    try {
      const senderEmailResult =
        await sendSenderShipmentConfirmationEmail({
          senderEmail: shipment.senderEmail,
          senderName: shipment.senderName,
          recipientName: shipment.recipientName,
          trackingNumber: shipment.trackingNumber,
          serviceName: shipment.serviceName,
          shippingPrice: shipment.shippingPrice.toString(),
          estimatedDelivery: shipment.estimatedDelivery!,
        });

      if (senderEmailResult.error) {
        console.error(
          "Sender confirmation email failed:",
          senderEmailResult.error
        );
      } else {
        senderEmailSent = true;
      }
    } catch (error) {
      console.error("Sender email error:", error);
    }

    // Return newly created shipment.
    return shipmentResponse(
      shipment,
      "Shipment created successfully.",
      emailSent,
      senderEmailSent,
      201
    );
  } catch (error) {
    console.error("Shipment creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create shipment. Please try again.",
      },
      { status: 500 }
    );
  }
}
