import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { stripe } from "@/lib/stripe";

type Props = {
  searchParams: {
    session_id?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: Props) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-xl shadow-sm border p-10 max-w-lg w-full text-center">
          <XCircle size={60} className="text-red-500 mx-auto mb-5" />

          <h1 className="text-2xl font-bold mb-3">
            Payment Session Not Found
          </h1>

          <p className="text-gray-500 mb-7">
            We could not find the payment session. Please return to
            your shipment and try again.
          </p>

          <Link
            href="/tracking"
            className="inline-block bg-purple-800 text-white px-6 py-3 rounded-md font-semibold"
          >
            Track Shipment
          </Link>
        </div>
      </main>
    );
  }

  let paymentStatus = "UNKNOWN";
  let trackingNumber = "";

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    paymentStatus = session.payment_status.toUpperCase();
    trackingNumber = session.metadata?.trackingNumber || "";
  } catch (error) {
    console.error("Unable to retrieve Stripe Checkout session:", error);
  }

  const paid = paymentStatus === "PAID";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12 max-w-lg w-full text-center">
        {paid ? (
          <CheckCircle2
            size={68}
            className="text-green-600 mx-auto mb-6"
          />
        ) : (
          <Clock
            size={68}
            className="text-orange-500 mx-auto mb-6"
          />
        )}

        <h1 className="text-3xl font-black text-gray-900 mb-3">
          {paid ? "Payment Successful!" : "Payment Processing"}
        </h1>

        <p className="text-gray-500 mb-7">
          {paid
            ? "Stripe confirms that your payment was successful."
            : "Your payment has not yet been confirmed. Please allow a moment for payment verification."}
        </p>

        {trackingNumber && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-5 mb-6">
            <p className="text-xs font-bold text-gray-500 mb-2">
              TRACKING NUMBER
            </p>

            <p className="text-xl font-black text-purple-800 break-all">
              {trackingNumber}
            </p>
          </div>
        )}

        <div
          className={`rounded-lg p-4 mb-7 text-sm ${
            paid
              ? "bg-green-50 text-green-700"
              : "bg-orange-50 text-orange-800"
          }`}
        >
          Payment status: <strong>{paymentStatus}</strong>
        </div>

        <p className="text-sm text-gray-500 mb-7">
          Your shipment will only be marked as paid after the
          Stripe webhook successfully verifies the transaction.
        </p>

        <div className="flex flex-col gap-3">
          {trackingNumber && (
            <Link
              href={`/tracking?number=${encodeURIComponent(trackingNumber)}`}
              className="bg-purple-800 text-white px-6 py-3 rounded-md font-semibold"
            >
              Track Shipment
            </Link>
          )}

          <Link
            href="/"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}