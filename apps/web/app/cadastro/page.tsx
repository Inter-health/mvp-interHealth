import Image from "next/image";
import Link from "next/link";

export default function CadastroPage() {
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
              src="/LogoInterHealth-white.svg"
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
            Complete seu perfil para acessar o painel clínico.Complete seu perfil para acessar o painel clínico.
          </p>

          {/* Form */}
          <form className="flex flex-col gap-4">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullname" className="text-sm font-medium text-[#404943]">
                Nome completo
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Dr. João da Silva"
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
                  className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="especialidade" className="text-sm font-medium text-[#404943]">
                  Especialidade médica
                </label>
                <input
                  id="especialidade"
                  type="text"
                  placeholder="Ex: Cardiologia"
                  className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
                />
              </div>
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
                className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
              />
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
                className="w-full h-[54px] rounded-lg bg-[#F1F5F2] px-4 text-sm text-[#1A1C1B] placeholder-[#707973] outline-none focus:ring-2 focus:ring-[#2ECC71]/40 transition"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
              <input
                type="checkbox"
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
              className="mt-2 w-full h-[60px] rounded-lg bg-[#2ECC71] hover:bg-[#1D8348] text-white font-semibold text-sm transition-colors active:opacity-80"
            >
              Criar minha conta
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

