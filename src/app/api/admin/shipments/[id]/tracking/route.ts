import { ShipmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT;")
  );
}

function isShipmentStatus(value: unknown): value is ShipmentStatus {
  return (
    typeof value === "string" &&
    Object.values(ShipmentStatus).some((status) => status === value)
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      await requireAdmin();
    } catch (error) {
      if (isRedirectError(error)) {
        return NextResponse.json(
          { error: "Unauthorized." },
          { status: 401 }
        );
      }

      throw error;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const { status, location, description } = payload;

    if (!isShipmentStatus(status)) {
      return NextResponse.json(
        { error: "Invalid shipment status." },
        { status: 400 }
      );
    }

    if (
      typeof location !== "string" ||
      !location.trim() ||
      location.trim().length > 150
    ) {
      return NextResponse.json(
        { error: "A valid location is required." },
        { status: 400 }
      );
    }

    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 1000
    ) {
      return NextResponse.json(
        { error: "A valid tracking description is required." },
        { status: 400 }
      );
    }

    const shipmentId = params.id;
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.trackingEvent.create({
        data: {
          shipmentId,
          status,
          location: location.trim(),
          description: description.trim(),
        },
      }),
      prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tracking event added successfully.",
    });
  } catch (error) {
    console.error("Tracking event creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create tracking event." },
      { status: 500 }
    );
  }
}
