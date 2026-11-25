import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_ORIGIN = "https://fedextracking.site.je";

function corsHeaders(origin: string | null) {
  const headers = new Headers();

  if (origin === ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  const headers = corsHeaders(request.headers.get("origin"));

  try {
    const trackingNumber = params.trackingNumber
      .trim()
      .toUpperCase();

    if (!trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Tracking number is required.",
        },
        { status: 400, headers }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: {
        trackingNumber,
      },
      include: {
        package: true,
        trackingEvents: {
          orderBy: {
            eventDate: "asc",
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          message: "No shipment was found with that tracking number.",
        },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        shipment: {
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          service: shipment.serviceName,
          estimatedDelivery: shipment.estimatedDelivery,
          createdAt: shipment.createdAt,
          deliveredAt: shipment.deliveredAt,

          package: shipment.package
            ? {
                description: shipment.package.description,
                weight: shipment.package.weight,
              }
            : null,

          trackingEvents: shipment.trackingEvents.map((event) => ({
            status: event.status,
            location: event.location,
            description: event.description,
            eventDate: event.eventDate,
          })),
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Tracking lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve shipment tracking information.",
      },
      { status: 500, headers }
    );
  }
}