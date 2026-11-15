import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

import {
  sendShipmentCreatedEmail,
  sendSenderShipmentConfirmationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

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

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sender,
      recipient,
      package: packageDetails,
      serviceCode,
    } = body;

    if (!sender || !recipient || !packageDetails) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing shipment information.",
        },
        { status: 400 }
      );
    }

    const requiredSenderFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "country",
    ];

    const requiredRecipientFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "country",
    ];

    for (const field of requiredSenderFields) {
      if (!isValidText(sender[field])) {
        return NextResponse.json(
          {
            success: false,
            message: `Sender ${field} is required.`,
          },
          { status: 400 }
        );
      }
    }

    for (const field of requiredRecipientFields) {
      if (!isValidText(recipient[field])) {
        return NextResponse.json(
          {
            success: false,
            message: `Recipient ${field} is required.`,
          },
          { status: 400 }
        );
      }
    }

    if (!isValidText(packageDetails.description)) {
      return NextResponse.json(
        {
          success: false,
          message: "Package description is required.",
        },
        { status: 400 }
      );
    }

    const dimensions = [
      packageDetails.weight,
      packageDetails.length,
      packageDetails.width,
      packageDetails.height,
    ];

    if (!dimensions.every(isValidNumber)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Package weight and dimensions must be positive numbers.",
        },
        { status: 400 }
      );
    }

    if (
      typeof serviceCode !== "string" ||
      !Object.prototype.hasOwnProperty.call(
        SHIPPING_SERVICES,
        serviceCode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shipping service.",
        },
        { status: 400 }
      );
    }

    const service =
      SHIPPING_SERVICES[
        serviceCode as keyof typeof SHIPPING_SERVICES
      ];

    const trackingNumber = `FDL${randomBytes(6)
      .toString("hex")
      .toUpperCase()}`;

    const estimatedDelivery = new Date();

    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + service.days
    );

    // Create shipment in database
    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber,

        senderName: sender.name.trim(),
        senderEmail: sender.email.trim(),
        senderPhone: sender.phone.trim(),
        senderAddress: sender.address.trim(),
        senderCity: sender.city.trim(),
        senderState: sender.state || null,
        senderPostal: sender.postalCode || null,
        senderCountry: sender.country.trim(),

        recipientName: recipient.name.trim(),
        recipientEmail: recipient.email.trim(),
        recipientPhone: recipient.phone.trim(),
        recipientAddress: recipient.address.trim(),
        recipientCity: recipient.city.trim(),
        recipientState: recipient.state || null,
        recipientPostal: recipient.postalCode || null,
        recipientCountry: recipient.country.trim(),

        description: packageDetails.description.trim(),
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
            description: packageDetails.description.trim(),
            weight: packageDetails.weight,
            length: packageDetails.length,
            width: packageDetails.width,
            height: packageDetails.height,
          },
        },

        trackingEvents: {
          create: {
            status: "PENDING",
            location: sender.city.trim(),
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

    // Email notification results
    let emailSent = false;
    let senderEmailSent = false;

    // Send recipient confirmation email
    try {
      const emailResult = await sendShipmentCreatedEmail({
        recipientEmail: shipment.recipientEmail,
        recipientName: shipment.recipientName,
        senderName: shipment.senderName,
        trackingNumber: shipment.trackingNumber,
        serviceName: shipment.serviceName,
        shippingPrice: shipment.shippingPrice.toString(),
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
    } catch (emailError) {
      console.error(
        "Recipient confirmation email error:",
        emailError
      );
    }

    // Send sender confirmation email
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
    } catch (senderEmailError) {
      console.error(
        "Sender confirmation email error:",
        senderEmailError
      );
    }

    // Return successful shipment response
    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully.",
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Shipment creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create shipment. Please try again.",
      },
      { status: 500 }
    );
  }
}