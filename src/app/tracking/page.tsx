"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  CalendarDays,
  Loader2,
  AlertCircle,
} from "lucide-react";

type TrackingEvent = {
  status: string;
  location: string;
  description: string;
  eventDate: string;
};

type Shipment = {
  trackingNumber: string;
  status: string;
  service: string;
  estimatedDelivery: string | null;
  createdAt: string;
  deliveredAt: string | null;
  package: {
    description: string;
    weight: number;
  } | null;
  trackingEvents: TrackingEvent[];
};

const statusLabels: Record<string, string> = {
  PENDING: "Shipment information received",
  CONFIRMED: "Shipment confirmed",
  PICKED_UP: "Package picked up",
  IN_TRANSIT: "In transit",
  AT_FACILITY: "Arrived at facility",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Shipment exception",
  CANCELLED: "Shipment cancelled",
};

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function trackShipment(e: React.FormEvent) {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number.");
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);

    try {
      const response = await fetch(
        `/api/tracking/${encodeURIComponent(trackingNumber.trim())}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Shipment not found.");
      }

      setShipment(data.shipment);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve tracking information."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-bold text-purple-800">
            FedEx Delivery
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-800"
          >
            <ArrowLeft size={17} />
            Home
          </Link>
        </div>
      </header>

      <section className="bg-purple-900 px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <Package size={45} className="mx-auto mb-5 text-orange-400" />

          <h1 className="mb-4 text-4xl font-bold">
            Track Your Shipment
          </h1>

          <p className="text-purple-100">
            Enter your tracking number to view your shipment status and
            recorded tracking updates.
          </p>

          <form
            onSubmit={trackShipment}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-xl bg-white p-3 shadow-lg sm:flex-row"
          >
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter your tracking number"
              className="min-w-0 flex-1 rounded-lg px-4 py-3 text-gray-900 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Search size={19} />
              )}
              {loading ? "Searching..." : "Track"}
            </button>
          </form>

          {error && (
            <div className="mx-auto mt-5 flex max-w-2xl items-center gap-2 rounded-lg bg-red-100 p-4 text-left text-sm text-red-800">
              <AlertCircle size={19} />
              {error}
            </div>
          )}
        </div>
      </section>

      {shipment && (
        <section className="container mx-auto max-w-4xl px-5 py-12">
          <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <p className="text-sm text-gray-500">
                  Tracking number
                </p>

                <h2 className="mt-1 text-2xl font-bold text-purple-900">
                  {shipment.trackingNumber}
                </h2>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Current shipment status
                </p>

                <span className="mt-2 inline-flex rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800">
                  {statusLabels[shipment.status] || shipment.status}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-t pt-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Truck className="mt-1 text-orange-500" />

                <div>
                  <p className="text-sm text-gray-500">
                    Shipping service
                  </p>
                  <p className="font-semibold text-gray-900">
                    {shipment.service}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 text-orange-500" />

                <div>
                  <p className="text-sm text-gray-500">
                    Estimated delivery
                  </p>
                  <p className="font-semibold text-gray-900">
                    {shipment.estimatedDelivery
                      ? formatDate(shipment.estimatedDelivery)
                      : "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="mt-1 text-orange-500" />

                <div>
                  <p className="text-sm text-gray-500">
                    Package description
                  </p>
                  <p className="font-semibold text-gray-900">
                    {shipment.package?.description || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 text-orange-500" />

                <div>
                  <p className="text-sm text-gray-500">
                    Shipment created
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(shipment.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-8 text-xl font-bold text-purple-900">
              Shipment History
            </h3>

            {shipment.trackingEvents.length === 0 ? (
              <p className="text-gray-500">
                No tracking updates have been recorded yet.
              </p>
            ) : (
              <div className="space-y-8">
                {shipment.trackingEvents.map((event, index) => {
                  const isLatest =
                    index === shipment.trackingEvents.length - 1;

                  return (
                    <div key={`${event.eventDate}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isLatest
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {event.status === "DELIVERED" ? (
                            <CheckCircle2 size={21} />
                          ) : event.status === "IN_TRANSIT" ||
                            event.status === "OUT_FOR_DELIVERY" ? (
                            <Truck size={21} />
                          ) : (
                            <Package size={21} />
                          )}
                        </div>

                        {index !== shipment.trackingEvents.length - 1 && (
                          <div className="mt-2 h-full min-h-10 w-px bg-gray-200" />
                        )}
                      </div>

                      <div className="flex-1 pb-2">
                        <h4 className="font-bold text-gray-900">
                          {statusLabels[event.status] || event.status}
                        </h4>

                        <p className="mt-1 text-sm text-gray-600">
                          {event.description}
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin size={15} />
                          {event.location}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(event.eventDate)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="mt-12 bg-gray-950 px-5 py-8 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} FedEx Delivery. All rights reserved.
        </p>

      
      </footer>
    </main>
  );
}