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

export default function StatusManager({
  shipmentId,
  currentStatus,
}: {
  shipmentId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function updateStatus() {
    if (!description.trim()) {
      setMessage("Please enter a tracking update description.");
      setError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(shipmentId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update shipment.");
      }

      setMessage("Shipment status updated successfully.");
      setDescription("");
      router.refresh();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-semibold">
        Update Shipment Status
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            New Shipment Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border p-3"
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
            Tracking Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Shipment has arrived at the sorting facility."
            rows={3}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button
          onClick={updateStatus}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Shipment"}
        </button>

        {message && (
          <p className={error ? "text-red-600" : "text-green-600"}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}