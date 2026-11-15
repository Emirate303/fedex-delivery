
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border p-8">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-purple-800" />
          </div>

          <h1 className="text-3xl font-black text-gray-900">
            FedEx Delivery
          </h1>

          <p className="text-gray-500 mt-2">
            Administrator Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-bold mb-2">
              Administrator Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full border rounded-lg p-3 outline-none focus:border-purple-700"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border rounded-lg p-3 outline-none focus:border-purple-700"
            />
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-800 hover:bg-purple-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Administrator Login
              </>
            )}
          </button>

        </form>

        <div className="border-t mt-8 pt-6 text-center">
          <Link href="/" className="text-sm text-purple-800 font-semibold">
            Return to website
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Independent shipping platform. Private administration access.
        </p>
      </div>
    </main>
  );
}
