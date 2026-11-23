import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Package,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

type PaymentStatus = (typeof paymentStatuses)[number];

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await requireAdmin();

  const requestedStatus = searchParams?.status?.toUpperCase();

  const selectedStatus = paymentStatuses.includes(
    requestedStatus as PaymentStatus
  )
    ? (requestedStatus as PaymentStatus)
    : "ALL";

  const where =
    selectedStatus === "ALL" ? {} : { status: selectedStatus };

  const [
  totalPayments,
  pendingPayments,
  paidPayments,
  failedPayments,
  paidTotal,
  pendingTotal,
  payments,
] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where,
      include: {
        shipment: {
          select: {
            id: true,
            trackingNumber: true,
            senderName: true,
            recipientName: true,
            serviceName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards = [
    {
      label: "Total Payments",
      value: totalPayments,
      icon: CreditCard,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Pending Payments",
      value: pendingPayments,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Successful Payments",
      value: paidPayments,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Failed Payments",
      value: failedPayments,
      icon: XCircle,
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">
              Payments Management
            </h1>

            <p className="mt-2 text-gray-600">
              Review payment records associated with shipments.
            </p>
          </div>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Confirmed Payments
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {formatCurrency(paidTotal._sum.amount?.toString() || "0")}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Total amount recorded with PAID status.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Outstanding Payments
            </p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {formatCurrency(pendingTotal._sum.amount?.toString() || "0")}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Payments currently awaiting confirmation.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Payment Records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {payments.length} record(s) displayed
              </p>
            </div>

           <form
  action="/admin/payments"
  method="GET"
  className="flex items-center gap-2"
>
  <select
    name="status"
    defaultValue={selectedStatus}
    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
  >
    <option value="ALL">All Payments</option>

    {paymentStatuses.map((status) => (
      <option key={status} value={status}>
        {status}
      </option>
    ))}
  </select>

  <button
    type="submit"
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Filter
  </button>
</form>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto mb-4 text-gray-400" size={40} />
              <h3 className="font-semibold text-gray-900">
                No payment records found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Payment records matching this filter will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Shipment</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {payment.reference || "Not assigned"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          ID: {payment.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-blue-700">
                          {payment.shipment.trackingNumber}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {payment.shipment.senderName} →{" "}
                          {payment.shipment.recipientName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {payment.shipment.serviceName}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(payment.amount.toString())}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(payment.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/shipments/${payment.shipment.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Package size={14} />
                          View Shipment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw size={14} />
          Payment records are loaded from the database.
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Only verified payment confirmations should be recorded as PAID.
          Pending payments are not counted as revenue.
        </p>
      </div>
    </main>
  );
}