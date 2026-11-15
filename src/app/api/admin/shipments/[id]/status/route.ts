import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendShipmentStatusEmail } from "@/lib/email";
const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_FACILITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
] as const;

type ShipmentStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (
      authError ||
      !user ||
      !adminEmail ||
      user.email?.trim().toLowerCase() !== adminEmail
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const status = body.status;

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status as ShipmentStatus)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid shipment status." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, message: "A tracking description is required." },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: params.id },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found." },
        { status: 404 }
      );
    }

    const updatedShipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: params.id },
        data: { status: status as ShipmentStatus },
      });

      await tx.trackingEvent.create({
        data: {
          shipmentId: params.id,
          status: status as ShipmentStatus,
          description,
          location: "Shipment processing facility",
        },
      });

      return updated;
    });

    let emailSent = false;

try {
  await sendShipmentStatusEmail({
    recipientEmail: shipment.recipientEmail,
    recipientName: shipment.recipientName,
    trackingNumber: shipment.trackingNumber,
    status: updatedShipment.status,
    description,
    location: "Shipment processing facility",
  });

  emailSent = true;
} catch (emailError) {
  console.error("Shipment notification email failed:", emailError);
}

return NextResponse.json({
  success: true,
  message: "Shipment status updated successfully.",
  emailSent,
  shipment: updatedShipment,
});
  } catch (error) {
    console.error("Admin shipment status update error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to update shipment status.",
      },
      { status: 500 }
    );
  }
}