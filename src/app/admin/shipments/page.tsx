import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage() {
  await requireAdmin();

  const shipments = await prisma.shipment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      package: true,
      payment: true,
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Shipment Management
            </h1>
            <p className="mt-2 text-gray-600">
              View all shipments registered on FedEx Delivery.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg bg-gray-800 px-5 py-2 text-white hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Shipments</p>
            <p className="mt-2 text-3xl font-bold">{shipments.length}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="mt-2 text-3xl font-bold">
              {shipments.filter((s) => s.status === "IN_TRANSIT").length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="mt-2 text-3xl font-bold">
              {shipments.filter((s) => s.status === "DELIVERED").length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">All Shipments</h2>
          </div>

          {shipments.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No shipments have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4">Tracking Number</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="border-t">
                      <td className="p-4 font-semibold">
                        {shipment.trackingNumber}
                      </td>

                      <td className="p-4">{shipment.recipientName}</td>

                      <td className="p-4">{shipment.serviceName}</td>

                      <td className="p-4">
                        ${Number(shipment.shippingPrice).toFixed(2)}
                      </td>

                      <td className="p-4">
                        {shipment.payment?.status ?? "N/A"}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {shipment.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="p-4">
                        {shipment.createdAt.toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/admin/shipments/${shipment.id}`}
                          className="inline-block whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}