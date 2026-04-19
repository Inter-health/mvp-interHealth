"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { saveToken } from "@/lib/api";

interface PasswordViolation {
  message: string;
  violations: string[];
}

function validatePassword(password: string): string[] {
  const violations: string[] = [];
  if (password.length < 8) violations.push("Mínimo de 8 caracteres");
  if (!/[A-Z]/.test(password)) violations.push("Letra maiúscula");
  if (!/[a-z]/.test(password)) violations.push("Letra minúscula");
  if (!/\d/.test(password)) violations.push("Número");
  if (!/[^A-Za-z0-9]/.test(password)) violations.push("Caractere especial");
  return violations;
}

export default function CadastroPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    crm: "",
    specialty: "",
    ehrProvider: "",
    email: "",
    password: "",
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<{
    password?: string[];
    email?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { id, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    // Clear field-level errors on change
    if (id === "password") setErrors((prev) => ({ ...prev, password: undefined }));
    if (id === "email") setErrors((prev) => ({ ...prev, email: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side password validation
    const pwViolations = validatePassword(form.password);
    if (pwViolations.length > 0) {
      setErrors({ password: pwViolations });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (res.status === 201) {
        const data = await res.json();
        saveToken(data.access_token);
        router.push("/dashboard");
        return;
      }

      const data = await res.json();

      if (res.status === 409) {
        setErrors({ email: "E-mail já cadastrado." });
        return;
      }

      if (res.status === 422) {
        const detail = data.detail as PasswordViolation | string;
        if (typeof detail === "object" && detail.violations) {
          setErrors({ password: detail.violations });
        } else {
          setErrors({ general: "Dados inválidos. Verifique os campos." });
        }
        return;
      }

      setErrors({ general: "Erro inesperado. Tente novamente." });
    } catch {
      setErrors({ general: "Não foi possível conectar ao servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — green */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#2ECC71] flex-col overflow-hidden">
        {/* Decorative white ovals */}
        <div
          className="absolute -top-28 -left-24 w-[448px] h-[717px] rounded-full"
          style={{ background: "rgba(255,255,255,0.12)" }}
        />
        <div
          className="absolute bottom-[100px] left-[72px] w-[384px] h-[614px] rounded-full"
          style={{ background: "#1D8348", opacity: 0.6 }}
        />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Image
            src="/LogoInterHealth-white.svg"
            alt="InterHealth"
            width={240}
            height={96}
            priority
          />
        </div>

        {/* Copy */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 pb-12">
          <div className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-8 flex flex-col gap-5 transition-all duration-300 hover:bg-white/20 hover:shadow-lg hover:scale-[1.02] cursor-default">
            <h1 className="text-4xl font-bold text-white leading-tight">
              A Precisão Empática.
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              Eleve sua prática clínica com uma IA que entende as nuances
              do cuidado. Junte-se a uma comunidade de médicos
              visionários que estão redefinindo a prestação de serviços de
              saúde.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-[#FDFEFE] px-6 py-12">
        <div className="w-full max-w-[448px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Image
              src="/LogoInterHealth.svg"
              alt="InterHealth"
              width={200}
              height={80}
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-[#1A1C1B] mb-1">
            Cadastro do Médico
          </h1>
          <p className="text-sm text-[#707973] mb-8">
            Complete seu perfil para acessar o painel clínico.
          </p>

          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-[#404943]">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                placeholder="Dr. João da Silva"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
              />
            </div>

            {/* CRM + Especialidade side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="crm" className="text-sm font-medium text-[#404943]">
                  Registro Médico (CRM)
                </label>
                <input
                  id="crm"
                  type="text"
                  placeholder="CRM/UF 000000"
                  value={form.crm}
                  onChange={handleChange}
                  required
                  className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="specialty" className="text-sm font-medium text-[#404943]">
                  Especialidade médica
                </label>
                <input
                  id="specialty"
                  type="text"
                  placeholder="Ex: Cardiologia"
                  value={form.specialty}
                  onChange={handleChange}
                  required
                  className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
                />
              </div>
            </div>

            {/* EHR Provider */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ehrProvider" className="text-sm font-medium text-[#404943]">
                Sistema clínico (EHR)
              </label>
              <select
                id="ehrProvider"
                value={form.ehrProvider}
                onChange={handleChange}
                required
                className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition appearance-none"
              >
                <option value="" disabled>Selecione seu sistema</option>
                <option value="iclinic">iClinic</option>
                <option value="feegow">Feegow</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#404943]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 transition ${
                  errors.email
                    ? "ring-2 ring-red-400 focus:ring-red-400"
                    : "focus:ring-[#2ECC71]/40"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#404943]">
                Senha
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                className={`w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 transition ${
                  errors.password
                    ? "ring-2 ring-red-400 focus:ring-red-400"
                    : "focus:ring-[#2ECC71]/40"
                }`}
              />
              {errors.password && errors.password.length > 0 && (
                <ul className="text-xs text-red-600 flex flex-col gap-0.5 mt-0.5">
                  {errors.password.map((v) => (
                    <li key={v}>• {v}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
              <input
                id="terms_accepted"
                type="checkbox"
                checked={form.terms_accepted}
                onChange={handleChange}
                required
                className="mt-0.5 w-4 h-4 rounded accent-[#2ECC71] cursor-pointer shrink-0"
              />
              <span className="text-sm text-[#707973] leading-relaxed">
                Concordo com os{" "}
                <Link href="#" className="text-[#2ECC71] hover:text-[#1D8348] font-medium transition-colors">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="#" className="text-[#2ECC71] hover:text-[#1D8348] font-medium transition-colors">
                  Política de Privacidade
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-[60px] rounded-lg bg-[#2ECC71] hover:bg-[#1D8348] text-white font-semibold text-sm transition-colors active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Criando conta…" : "Criar minha conta"}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-[#707973] mt-8">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-[#2ECC71] hover:text-[#1D8348] font-semibold transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
