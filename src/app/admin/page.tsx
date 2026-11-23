import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  AlertTriangle,
  DollarSign,
  CreditCard,
  ArrowRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/supabase/admin";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  // Retrieve dashboard statistics.
  const [
    totalShipments,
    pendingShipments,
    confirmedShipments,
    inTransitShipments,
    deliveredShipments,
    exceptionShipments,
    cancelledShipments,
    pendingPayments,
    paidPayments,
    revenue,
    recentShipments,
  ] = await Promise.all([
    prisma.shipment.count(),

    prisma.shipment.count({
      where: { status: "PENDING" },
    }),

    prisma.shipment.count({
      where: { status: "CONFIRMED" },
    }),

    prisma.shipment.count({
      where: {
        status: {
          in: [
            "PICKED_UP",
            "IN_TRANSIT",
            "AT_FACILITY",
            "OUT_FOR_DELIVERY",
          ],
        },
      },
    }),

    prisma.shipment.count({
      where: { status: "DELIVERED" },
    }),

    prisma.shipment.count({
      where: { status: "EXCEPTION" },
    }),

    prisma.shipment.count({
      where: { status: "CANCELLED" },
    }),

    prisma.payment.count({
      where: { status: "PENDING" },
    }),

    prisma.payment.count({
      where: { status: "PAID" },
    }),

    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),

    prisma.shipment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trackingNumber: true,
        recipientName: true,
        serviceName: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const totalRevenue = Number(
    revenue._sum.amount ?? 0
  );

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalRevenue);

  const statistics = [
    {
      title: "Total Shipments",
      value: totalShipments,
      icon: Package,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Pending Shipments",
      value: pendingShipments,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "Confirmed Shipments",
      value: confirmedShipments,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "In Transit",
      value: inTransitShipments,
      icon: Truck,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Delivered",
      value: deliveredShipments,
      icon: PackageCheck,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Exceptions",
      value: exceptionShipments,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700",
    },
    {
      title: "Cancelled",
      value: cancelledShipments,
      icon: AlertTriangle,
      color: "bg-gray-100 text-gray-700",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Dashboard Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              ADMINISTRATION
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              FedEx Delivery Admin
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Signed in as {user.email}
            </p>
          </div>

          <LogoutButton />
        </header>

        {/* Main Statistics */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Shipment Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Live statistics from your shipment database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {item.title}
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {item.value}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-3 ${item.color}`}
                    >
                      <Icon size={25} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Financial Overview */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Financial Overview
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3 text-green-700">
                  <DollarSign size={24} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Paid Revenue
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {formattedRevenue}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Calculated from PAID payment records only.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-3 text-yellow-700">
                  <Clock size={24} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Pending Payments
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {pendingPayments}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                  <CreditCard size={24} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Successful Payments
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {paidPayments}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Recent Shipments */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Shipments
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                The five most recently created shipments.
              </p>
            </div>

            <Link
              href="/admin/shipments"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {recentShipments.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No shipments have been created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="px-4 py-3">Tracking Number</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentShipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 font-semibold text-blue-600">
                        <Link
                          href={`/admin/shipments/${shipment.id}`}
                        >
                          {shipment.trackingNumber}
                        </Link>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {shipment.recipientName}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {shipment.serviceName}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {shipment.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                        {shipment.createdAt.toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Navigation */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Management
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/admin/shipments"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <Package className="mb-3 text-blue-600" size={28} />

              <h3 className="text-lg font-semibold text-gray-900">
                Shipment Management
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View shipments, inspect shipment details, and update statuses.
              </p>
            </Link>
            <Link
  href="/admin/payments"
  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
>
  <div>
    <h3 className="font-semibold text-gray-900">
      Payments Management
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      View payment records and payment summaries.
    </p>
  </div>

  <span className="text-blue-600">→</span>
</Link>

            <Link
              href="/tracking"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <Truck className="mb-3 text-green-600" size={28} />

              <h3 className="text-lg font-semibold text-gray-900">
                Public Tracking
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Open the customer-facing shipment tracking page.
              </p>
            </Link>
          </div>
        </section>

        <footer className="mt-10 border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          FedEx Delivery Administration
        </footer>

      </div>
    </main>
  );
}