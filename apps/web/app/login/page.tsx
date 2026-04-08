"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.status === 200) {
        localStorage.setItem("access_token", data.access_token);
        router.push("/dashboard");
        return;
      }

      if (res.status === 401) {
        setError("E-mail ou senha incorretos.");
        return;
      }

      setError("Erro inesperado. Tente novamente.");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F8F9FA] overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[640px] h-[512px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, #2ECC71 0%, transparent 70%)",
          opacity: 0.07,
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[640px] h-[512px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, #26A69A 0%, transparent 70%)",
          opacity: 0.07,
          filter: "blur(60px)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 bg-white rounded-xl shadow-sm border border-[#E7E8E9] px-10 py-10">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/LogoInterHealth.svg"
            alt="InterHealth"
            width={240}
            height={96}
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#191C1D] mb-1">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-[#6B7280] mb-8">
          Entre com sua conta para continuar
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#3D4A3E]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full h-12 rounded-lg bg-[#F3F4F5] px-4 text-sm text-[#191C1D] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#3D4A3E]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full h-12 rounded-lg bg-[#F3F4F5] px-4 text-sm text-[#191C1D] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end mt-1">
            <Link
              href="#"
              className="text-sm text-[#2ECC71] hover:text-[#1D8348] font-medium transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-12 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #2ECC71 0%, #26A69A 100%)",
            }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {/* Sign up */}
        <p className="text-center text-sm text-[#6B7280] mt-8">
          Não tem uma conta?{" "}
          <Link
            href="/cadastro"
            className="text-[#2ECC71] hover:text-[#1D8348] font-semibold transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
