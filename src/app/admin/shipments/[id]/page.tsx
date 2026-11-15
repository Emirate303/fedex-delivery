import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import StatusManager from "./status-manager";
export const dynamic = "force-dynamic";

export default async function ShipmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const shipment = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: {
      package: true,
      payment: true,
      trackingEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shipment) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/shipments"
          className="text-blue-600 hover:underline"
        >
          ← Back to Shipments
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          Shipment Details
        </h1>

        <p className="mt-2 text-gray-600">
          Tracking Number: {shipment.trackingNumber}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Shipment Information
            </h2>
            <p>Status: {shipment.status.replaceAll("_", " ")}</p>
            <p>Service: {shipment.serviceName}</p>
            <p>
              Price: ${Number(shipment.shippingPrice).toFixed(2)}
            </p>
            <p>Created: {shipment.createdAt.toLocaleString()}</p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Recipient Information
            </h2>
            <p>Name: {shipment.recipientName}</p>
            <p>Email: {shipment.recipientEmail}</p>
            <p>Phone: {shipment.recipientPhone}</p>
            <p>Address: {shipment.recipientAddress}</p>
            <p>City: {shipment.recipientCity}</p>
            <p>State: {shipment.recipientState}</p>
            <p>Country: {shipment.recipientCountry}</p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Package Information
            </h2>
            <p>
              Description: {shipment.package?.description ?? "N/A"}
            </p>
            <p>
              Weight: {shipment.package?.weight?.toString() ?? "N/A"}
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Payment Information
            </h2>
            <p>Status: {shipment.payment?.status ?? "N/A"}</p>
            <p>
              Amount: ${Number(shipment.shippingPrice).toFixed(2)}
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold">
            Tracking History
          </h2>
        <StatusManager
  shipmentId={shipment.id}
  currentStatus={shipment.status}
/>
          {shipment.trackingEvents.length === 0 ? (
            <p>No tracking events available.</p>
          ) : (
            <div className="space-y-5">
              {shipment.trackingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-2 border-blue-500 pl-4"
                >
                  <p className="font-semibold">
                    {event.status.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {event.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {event.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}