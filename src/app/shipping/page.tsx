"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Truck,
  Globe,
  Zap,
  Loader2,
  Copy,
} from "lucide-react";

type AddressDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type PackageDetails = {
  description: string;
  weight: string;
  length: string;
  width: string;
  height: string;
};

type CreatedShipment = {
  id: string;
  trackingNumber: string;
  status: string;
  service: string;
  shippingPrice: string;
  currency: string;
  estimatedDelivery: string | null;
  paymentStatus: string;
};

const services = [
  {
    id: "EXPRESS",
    name: "Express Delivery",
    description: "Priority delivery service",
    price: 39.99,
    icon: Zap,
    duration: "1–2 business days",
  },
  {
    id: "STANDARD",
    name: "Standard Shipping",
    description: "Affordable everyday delivery",
    price: 19.99,
    icon: Truck,
    duration: "3–5 business days",
  },
  {
    id: "INTERNATIONAL",
    name: "International Shipping",
    description: "Cross-border delivery service",
    price: 59.99,
    icon: Globe,
    duration: "5–10 business days",
  },
];

export default function ShippingPage() {
  const [step, setStep] = useState(1);

  const [sender, setSender] = useState<AddressDetails>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });

  const [recipient, setRecipient] = useState<AddressDetails>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });

  const [pkg, setPkg] = useState<PackageDetails>({
    description: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [service, setService] = useState("STANDARD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdShipment, setCreatedShipment] =
    useState<CreatedShipment | null>(null);

  const selectedService = services.find(
    (item) => item.id === service
  )!;

  function updateSender(
    field: keyof AddressDetails,
    value: string
  ) {
    setSender((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateRecipient(
    field: keyof AddressDetails,
    value: string
  ) {
    setRecipient((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePackage(
    field: keyof PackageDetails,
    value: string
  ) {
    setPkg((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function nextStep() {
    setError("");

    if (step === 1) {
      if (
        !sender.name.trim() ||
        !sender.email.trim() ||
        !sender.phone.trim() ||
        !sender.address.trim() ||
        !sender.city.trim() ||
        !sender.country.trim()
      ) {
        setError("Please complete all required sender information.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email)) {
        setError("Please enter a valid sender email address.");
        return;
      }
    }

    if (step === 2) {
      if (
        !recipient.name.trim() ||
        !recipient.email.trim() ||
        !recipient.phone.trim() ||
        !recipient.address.trim() ||
        !recipient.city.trim() ||
        !recipient.country.trim()
      ) {
        setError("Please complete all required recipient information.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
        setError("Please enter a valid recipient email address.");
        return;
      }
    }

    if (step === 3) {
      const measurements = [
        pkg.weight,
        pkg.length,
        pkg.width,
        pkg.height,
      ];

      if (
        !pkg.description.trim() ||
        measurements.some(
          (value) => !value || !Number.isFinite(Number(value)) || Number(value) <= 0
        )
      ) {
        setError("Please enter valid package information.");
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 4));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function createShipment() {
    if (submitting || createdShipment) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          recipient,
          package: {
            description: pkg.description,
            weight: Number(pkg.weight),
            length: Number(pkg.length),
            width: Number(pkg.width),
            height: Number(pkg.height),
          },
          serviceCode: service,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create shipment."
        );
      }

      setCreatedShipment(data.shipment);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTrackingNumber() {
    if (!createdShipment) return;

    try {
      await navigator.clipboard.writeText(
        createdShipment.trackingNumber
      );
      alert("Tracking number copied.");
    } catch {
      setError("Unable to copy tracking number.");
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md p-3 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700";

  if (createdShipment) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-5 h-20 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-black text-purple-800">
                Fed<span className="text-orange-500">Ex</span>
              </span>
              <span className="font-bold text-gray-700">
                Delivery
              </span>
            </Link>
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-5 py-20">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12 text-center">
            <CheckCircle2
              size={64}
              className="text-green-600 mx-auto mb-6"
            />

            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Shipment Created Successfully!
            </h1>

            <p className="text-gray-500 mb-8">
              Your shipment information has been saved.
              Keep your tracking number for future reference.
            </p>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-500 font-semibold mb-2">
                YOUR TRACKING NUMBER
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <p className="text-2xl md:text-3xl font-black text-purple-800 break-all">
                  {createdShipment.trackingNumber}
                </p>

                <button
                  onClick={copyTrackingNumber}
                  className="p-2 rounded-md hover:bg-purple-100"
                  title="Copy tracking number"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="text-left border rounded-lg divide-y mb-8">
              <div className="p-4 flex justify-between gap-4">
                <span className="text-gray-500">Shipment status</span>
                <span className="font-bold">
                  {createdShipment.status}
                </span>
              </div>

              <div className="p-4 flex justify-between gap-4">
                <span className="text-gray-500">Delivery service</span>
                <span className="font-bold">
                  {createdShipment.service}
                </span>
              </div>

              <div className="p-4 flex justify-between gap-4">
                <span className="text-gray-500">Shipping price</span>
                <span className="font-bold">
                  {createdShipment.currency}{" "}
                  {Number(createdShipment.shippingPrice).toFixed(2)}
                </span>
              </div>

              <div className="p-4 flex justify-between gap-4">
                <span className="text-gray-500">Payment status</span>
                <span className="font-bold">
                  {createdShipment.paymentStatus}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Your shipment is currently pending. Payment and
              actual delivery arrangements have not yet been completed.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="purple-button rounded-md text-center"
              >
                Back to Home
              </Link>

              <Link
                href="/tracking"
                className="orange-button rounded-md text-center"
              >
                Track Shipment
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-400 py-7 text-center text-xs">
          © {new Date().getFullYear()} FedEx Delivery.
          Independent shipping platform, not affiliated with or
          endorsed by FedEx Corporation.
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl font-black text-purple-800">
              Fed<span className="text-orange-500">Ex</span>
            </span>
            <span className="font-bold text-gray-700">
              Delivery
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 flex items-center gap-2"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </header>

      <section className="bg-purple-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-orange-400 font-bold text-sm uppercase mb-3">
            Shipping Center
          </p>

          <h1 className="text-4xl font-black mb-3">
            Create a Shipment
          </h1>

          <p className="text-purple-100">
            Enter your shipment details and select a delivery service.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pt-10">
        <div className="grid grid-cols-4 gap-3">
          {["Sender", "Recipient", "Package", "Delivery"].map(
            (label, index) => {
              const number = index + 1;
              const active = step === number;
              const completed = step > number;

              return (
                <div key={label}>
                  <div
                    className={`h-2 rounded-full ${
                      completed || active
                        ? "bg-orange-500"
                        : "bg-gray-200"
                    }`}
                  />

                  <p
                    className={`text-xs md:text-sm mt-3 font-bold ${
                      active || completed
                        ? "text-purple-800"
                        : "text-gray-400"
                    }`}
                  >
                    {number}. {label}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-9">

              {step === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <User className="text-purple-800" size={28} />

                    <div>
                      <h2 className="text-2xl font-bold">
                        Sender Information
                      </h2>

                      <p className="text-gray-500 text-sm">
                        Enter the details of the person sending the package.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {(
                      [
                        ["name", "Full Name", "John Smith"],
                        ["email", "Email Address", "john@example.com"],
                        ["phone", "Phone Number", "+1 555 000 0000"],
                        ["address", "Street Address", "123 Main Street"],
                        ["city", "City", "Los Angeles"],
                        ["state", "State", "California"],
                        ["postalCode", "ZIP / Postal Code", "90001"],
                      ] as const
                    ).map(([field, label, placeholder]) => (
                      <div key={field}>
                        <label className="block text-sm font-bold mb-2">
                          {label}
                        </label>

                        <input
                          className={inputClass}
                          placeholder={placeholder}
                          value={sender[field]}
                          onChange={(e) =>
                            updateSender(field, e.target.value)
                          }
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Country
                      </label>

                      <select
                        className={inputClass}
                        value={sender.country}
                        onChange={(e) =>
                          updateSender("country", e.target.value)
                        }
                      >
                        {[
                          "United States",
                          "United Kingdom",
                          "Canada",
                          "Nigeria",
                          "Germany",
                          "France",
                        ].map((country) => (
                          <option key={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <MapPin className="text-purple-800" size={28} />

                    <div>
                      <h2 className="text-2xl font-bold">
                        Recipient Information
                      </h2>

                      <p className="text-gray-500 text-sm">
                        Where should we deliver the package?
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {(
                      [
                        ["name", "Full Name", "Recipient Name"],
                        ["email", "Email Address", "recipient@example.com"],
                        ["phone", "Phone Number", "+1 555 000 0000"],
                        ["address", "Street Address", "456 Park Avenue"],
                        ["city", "City", "New York"],
                        ["state", "State", "New York"],
                        ["postalCode", "ZIP / Postal Code", "10001"],
                      ] as const
                    ).map(([field, label, placeholder]) => (
                      <div key={field}>
                        <label className="block text-sm font-bold mb-2">
                          {label}
                        </label>

                        <input
                          className={inputClass}
                          placeholder={placeholder}
                          value={recipient[field]}
                          onChange={(e) =>
                            updateRecipient(field, e.target.value)
                          }
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Country
                      </label>

                      <select
                        className={inputClass}
                        value={recipient.country}
                        onChange={(e) =>
                          updateRecipient("country", e.target.value)
                        }
                      >
                        {[
                          "United States",
                          "United Kingdom",
                          "Canada",
                          "Nigeria",
                          "Germany",
                          "France",
                        ].map((country) => (
                          <option key={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <Package className="text-purple-800" size={28} />

                    <div>
                      <h2 className="text-2xl font-bold">
                        Package Information
                      </h2>

                      <p className="text-gray-500 text-sm">
                        Provide the package description and measurements.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block font-bold text-sm mb-2">
                        Package Description
                      </label>

                      <input
                        className={inputClass}
                        placeholder="Example: Clothing, electronics, documents"
                        value={pkg.description}
                        onChange={(e) =>
                          updatePackage("description", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-sm mb-2">
                        Package Weight (kg)
                      </label>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={inputClass}
                        placeholder="Example: 5"
                        value={pkg.weight}
                        onChange={(e) =>
                          updatePackage("weight", e.target.value)
                        }
                      />
                    </div>

                    <h3 className="font-bold text-lg pt-3">
                      Package Dimensions (cm)
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                      {(
                        [
                          ["length", "Length"],
                          ["width", "Width"],
                          ["height", "Height"],
                        ] as const
                      ).map(([field, label]) => (
                        <div key={field}>
                          <label className="block font-bold text-sm mb-2">
                            {label}
                          </label>

                          <input
                            type="number"
                            min="0.01"
                            step="0.1"
                            className={inputClass}
                            placeholder="0"
                            value={pkg[field]}
                            onChange={(e) =>
                              updatePackage(field, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <Truck className="text-purple-800" size={28} />

                    <div>
                      <h2 className="text-2xl font-bold">
                        Delivery Service
                      </h2>

                      <p className="text-gray-500 text-sm">
                        Choose your preferred delivery service.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {services.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setService(item.id)}
                          className={`w-full border-2 rounded-lg p-5 text-left flex items-center gap-4 ${
                            service === item.id
                              ? "border-purple-800 bg-purple-50"
                              : "border-gray-200"
                          }`}
                        >
                          <Icon
                            size={32}
                            className="text-purple-800 shrink-0"
                          />

                          <div className="flex-1">
                            <h3 className="font-bold">{item.name}</h3>

                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {item.duration}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-black text-purple-800">
                              ${item.price.toFixed(2)}
                            </p>

                            {service === item.id && (
                              <CheckCircle2
                                className="text-green-600 ml-auto mt-2"
                                size={20}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-bold text-lg mb-5">
                      Shipment Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Sender</span>
                        <span className="font-bold">{sender.name}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Recipient</span>
                        <span className="font-bold">{recipient.name}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Package</span>
                        <span className="font-bold">{pkg.description}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-bold">{pkg.weight} kg</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Service</span>
                        <span className="font-bold">
                          {selectedService.name}
                        </span>
                      </div>

                      <div className="flex justify-between border-t pt-5 text-lg">
                        <span className="font-bold">Estimated Price</span>
                        <span className="font-black text-purple-800">
                          ${selectedService.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-5">
                      Demonstration pricing. The server calculates the
                      amount saved with your shipment.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-between mt-10 pt-7 border-t">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={submitting}
                    className="px-6 py-3 border rounded-md font-bold flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="px-6 py-3 border rounded-md font-bold"
                  >
                    Cancel
                  </Link>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="orange-button rounded-md flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={createShipment}
                    disabled={submitting}
                    className="orange-button rounded-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating Shipment...
                      </>
                    ) : (
                      <>
                        Create Shipment
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-bold text-lg mb-5">
                Shipment Progress
              </h3>

              {[
                "Sender details",
                "Recipient details",
                "Package details",
                "Delivery selection",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 mb-5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= index + 1
                        ? "bg-purple-800 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > index + 1 ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <span className="text-sm font-medium pt-1">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-purple-800 text-white rounded-xl p-7">
              <Package size={35} className="text-orange-400 mb-5" />

              <h3 className="font-bold text-xl mb-3">
                Need Shipping Help?
              </h3>

              <p className="text-purple-100 text-sm leading-relaxed">
                Contact our support team for assistance with shipment
                preparation and delivery questions.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-7 text-center text-xs">
        © {new Date().getFullYear()} FedEx Delivery.
        Independent shipping platform, not affiliated with or
        endorsed by FedEx Corporation.
      </footer>
    </main>
  );
}