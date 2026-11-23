"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_FACILITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
];

export default function TrackingEventForm({
  shipmentId,
  currentStatus,
}: {
  shipmentId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(shipmentId)}/tracking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            location,
            description,
          }),
        }
      );

      const contentType = response.headers.get("content-type") ?? "";
      let data: unknown;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(
          `The server returned an unexpected response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        const errorMessage =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to add tracking event.";
        throw new Error(errorMessage);
      }

      setMessage("Tracking event added successfully.");
      setLocation("");
      setDescription("");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Add Tracking Update
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Shipment Status
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Location
          </label>

          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Enter shipment location"
            required
            maxLength={150}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Tracking Description
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the shipment update..."
            required
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          />
        </div>

        {message && (
          <p className="rounded-lg bg-green-100 p-3 text-sm text-green-800">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Adding Update..." : "Add Tracking Update"}
        </button>
      </form>
    </div>
  );
}