"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

export default function SignUpPage() {
  const supabase = createClient();
  const { locale } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isId = locale === "id";

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        isId
          ? "Akun berhasil dibuat! Silakan cek email jika diperlukan verifikasi, atau langsung masuk."
          : "Account created successfully! Please check your email for verification, or proceed to sign in."
      );
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#092328] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-semibold">
          {isId ? "Gabung ARVENA" : "Join ARVENA"}
        </h1>

        <p className="mt-2 text-sm text-white/40">
          {isId
            ? "Buat akun Anda dan jadilah bagian dari ekosistem sirkular."
            : "Create your account and become part of the circular ecosystem."}
        </p>

        <form onSubmit={handleSignUp} className="mt-8 space-y-4">
          <input
            type="text"
            autoComplete="name"
            placeholder={isId ? "Nama Lengkap" : "Full name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400/40"
          />

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
            autoComplete="new-password"
            placeholder={isId ? "Kata Sandi (minimal 6 karakter)" : "Password (min. 6 characters)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400/40"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2A835F] border border-[#12544F] py-3 font-semibold text-white shadow-sm transition hover:bg-[#349e73] disabled:opacity-50"
          >
            {loading
              ? isId ? "Mendaftarkan..." : "Creating account..."
              : isId ? "Daftar Akun" : "Create account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-sm text-emerald-300">
            {message}
          </p>
        )}

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-white/50">
            {isId ? "Sudah memiliki akun?" : "Already have an account?"}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              {isId ? "Masuk" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}