"use client";

import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
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

        {/* Form */}
        <form className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#3D4A3E]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
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
              className="w-full h-12 rounded-lg bg-[#F3F4F5] px-4 text-sm text-[#191C1D] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
            />
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-[#2ECC71] cursor-pointer"
              />
              <span className="text-sm text-[#6B7280]">Lembrar-me</span>
            </label>
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
            className="mt-2 w-full h-12 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: "linear-gradient(135deg, #2ECC71 0%, #26A69A 100%)",
            }}
          >
            Entrar
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#E7E8E9]" />
          <span className="text-xs text-[#6B7280]">ou continue com</span>
          <div className="flex-1 h-px bg-[#E7E8E9]" />
        </div>

        {/* Google button */}
        <button
          type="button"
          className="w-full h-11 rounded-lg bg-[#E7E8E9] hover:bg-[#EDEEEF] text-[#556158] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <GoogleIcon />
          Entrar com Google
        </button>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
