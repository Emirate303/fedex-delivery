import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import LogoutButton from "./logout-button";
export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            FedEx Delivery Admin
          </h1>

          <p className="mt-2 text-gray-600">
            Signed in as {user.email}
          </p>
          <div className="mt-4">
  <LogoutButton />
</div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/admin/shipments"
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Shipments
            </h2>
            <p className="mt-2 text-gray-600">
              View and manage customer shipments.
            </p>
          </Link>

          <Link
            href="/admin/tracking"
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Tracking
            </h2>
            <p className="mt-2 text-gray-600">
              Manage shipment tracking events.
            </p>
          </Link>

          <Link
            href="/admin/payments"
            className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Payments
            </h2>
            <p className="mt-2 text-gray-600">
              View shipment payment records.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}