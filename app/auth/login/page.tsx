"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const { locale } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const isId = locale === "id";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#092328] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-semibold">
          {isId ? "Selamat datang kembali" : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm text-white/40">
          {isId
            ? "Masuk ke akun ekosistem ARVENA Anda."
            : "Sign in to your ARVENA ecosystem."}
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-4"
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400/40"
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder={isId ? "Kata Sandi" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400/40"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2A835F] border border-[#12544F] py-3 font-semibold text-white shadow-sm transition hover:bg-[#349e73] disabled:opacity-50"
          >
            {loading
              ? isId ? "Memproses..." : "Signing in..."
              : isId ? "Masuk" : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="mt-5 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-white/50">
            {isId ? "Belum punya akun?" : "Don't have an account yet?"}{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              {isId ? "Daftar" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}