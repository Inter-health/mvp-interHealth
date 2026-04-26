import Image from "next/image";
import Link from "next/link";

const C: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 48px",
  width: "100%",
};

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid #EAEDED",
    }}>
      <div style={{ ...C, height: "100%", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <Image src="/miniLogoInterHealth.png" alt="InterHealth" width={30} height={30} />
          <span style={{ font: "700 15px/1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.2px" }}>
            InterHealth
          </span>
        </Link>

        <nav style={{ display: "flex", gap: 32, marginLeft: 52 }}>
          {[
            { label: "Solução",  href: "/solução",  active: true },
            { label: "Preços",   href: "/#precos",  active: false },
            { label: "Empresas", href: "/#empresas", active: false },
          ].map(({ label, href, active }) => (
            <Link key={label} href={href} style={{
              font: "500 14px/1 var(--ih-font-body)",
              color: active ? "#2ECC71" : "#556158",
              textDecoration: "none",
            }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/login" style={{
            font: "500 14px/1 var(--ih-font-body)",
            color: "#191C1D",
            textDecoration: "none",
          }}>
            Login
          </Link>
          <Link href="/cadastro" style={{
            display: "inline-flex", alignItems: "center",
            height: 38, padding: "0 20px", borderRadius: 10,
            background: "#2ECC71", color: "#fff",
            font: "700 14px/1 var(--ih-font-body)",
            textDecoration: "none",
            boxShadow: "0 2px 10px rgba(46,204,113,.30)",
          }}>
            Começar Agora
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ paddingTop: 104, paddingBottom: 72, background: "#fff" }}>
      <div style={{ ...C, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>

        {/* Left — text */}
        <div style={{ paddingTop: 16 }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#EAFAF1", borderRadius: 20,
            padding: "6px 14px",
            font: "700 10px/1 var(--ih-font-body)",
            color: "#2ECC71", letterSpacing: "1.4px",
            textTransform: "uppercase", marginBottom: 28,
          }}>
            B2B Empresa
          </div>

          <h1 style={{
            font: "800 56px/1.1 var(--ih-font-display)",
            letterSpacing: "-2.2px",
            margin: "0 0 22px",
            color: "#191C1D",
          }}>
            Transforme sua{" "}
            <span style={{ color: "#2ECC71" }}>Clínica</span>
            <br />
            em um Santuário<br />Digital.
          </h1>

          <p style={{
            font: "400 16px/1.75 var(--ih-font-body)",
            color: "#6B7280",
            maxWidth: 480, margin: "0 0 40px",
          }}>
            Unificamos a precisão clínica com uma experiência humana excepcional.
            Nossa plataforma integrada foi desenhada para grandes instituições que
            não abrem mão de segurança e performance.
          </p>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Segurança de Dados */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "#EAFAF1", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div style={{ font: "700 15px/1 var(--ih-font-display)", color: "#191C1D", marginBottom: 6 }}>
                  Segurança de Dados
                </div>
                <p style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#6B7280", margin: 0, maxWidth: 340 }}>
                  Criptografia de contas com conformidade com LGPD e HIPAA, tecnologia
                  que garante mais segurança e valor dos pacientes.
                </p>
              </div>
            </div>

            {/* Escalabilidade */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "#EAFAF1", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div>
                <div style={{ font: "700 15px/1 var(--ih-font-display)", color: "#191C1D", marginBottom: 6 }}>
                  Escalabilidade
                </div>
                <p style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#6B7280", margin: 0, maxWidth: 340 }}>
                  Infraestrutura em nuvem preparada para suportar dezenas de clínicas
                  premium em funcionamento simultâneo com alto volume de acessos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Demo form card */}
        <div style={{
          background: "#fff",
          border: "1px solid #EAEDED",
          borderRadius: 20,
          padding: "36px 32px 28px",
          boxShadow: "0 4px 32px rgba(0,0,0,.07)",
        }}>
          <h2 style={{
            font: "700 22px/1.2 var(--ih-font-display)",
            letterSpacing: "-.5px", margin: "0 0 8px",
            color: "#191C1D",
          }}>
            Agendar Demo
          </h2>
          <p style={{
            font: "400 13px/1.6 var(--ih-font-body)",
            color: "#94A3B8", margin: "0 0 28px",
          }}>
            Demo para que possamos entender sua operação clínica melhor.
          </p>

          {/* NOME DA EMPRESA */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              font: "700 10px/1 var(--ih-font-body)",
              color: "#94A3B8", letterSpacing: "1.2px",
              textTransform: "uppercase", marginBottom: 8,
            }}>
              Nome da Empresa
            </label>
            <input
              type="text"
              placeholder="Ex: Hospital Santa Luzia"
              style={{
                width: "100%", height: 44, borderRadius: 10,
                border: "1px solid #E2E8F0",
                padding: "0 14px",
                font: "400 14px/1 var(--ih-font-body)",
                color: "#191C1D",
                outline: "none",
                boxSizing: "border-box",
                background: "#FAFAFA",
              }}
            />
          </div>

          {/* CARGO + Nº DE MÉDICOS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{
                display: "block",
                font: "700 10px/1 var(--ih-font-body)",
                color: "#94A3B8", letterSpacing: "1.2px",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Cargo
              </label>
              <select style={{
                width: "100%", height: 44, borderRadius: 10,
                border: "1px solid #E2E8F0",
                padding: "0 14px",
                font: "400 14px/1 var(--ih-font-body)",
                color: "#191C1D",
                outline: "none",
                background: "#FAFAFA",
                appearance: "none",
              }}>
                <option>Clínico</option>
                <option>Diretor</option>
                <option>Gestor</option>
                <option>CEO</option>
                <option>TI</option>
              </select>
            </div>
            <div>
              <label style={{
                display: "block",
                font: "700 10px/1 var(--ih-font-body)",
                color: "#94A3B8", letterSpacing: "1.2px",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Nº de Médicos
              </label>
              <select style={{
                width: "100%", height: 44, borderRadius: 10,
                border: "1px solid #E2E8F0",
                padding: "0 14px",
                font: "400 14px/1 var(--ih-font-body)",
                color: "#191C1D",
                outline: "none",
                background: "#FAFAFA",
                appearance: "none",
              }}>
                <option>1 – 10</option>
                <option>11 – 50</option>
                <option>51 – 200</option>
                <option>200+</option>
              </select>
            </div>
          </div>

          {/* E-MAIL CORPORATIVO */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              font: "700 10px/1 var(--ih-font-body)",
              color: "#94A3B8", letterSpacing: "1.2px",
              textTransform: "uppercase", marginBottom: 8,
            }}>
              E-mail Corporativo
            </label>
            <input
              type="email"
              placeholder="seu@hospital.com.br"
              style={{
                width: "100%", height: 44, borderRadius: 10,
                border: "1px solid #E2E8F0",
                padding: "0 14px",
                font: "400 14px/1 var(--ih-font-body)",
                color: "#191C1D",
                outline: "none",
                boxSizing: "border-box",
                background: "#FAFAFA",
              }}
            />
          </div>

          {/* Submit */}
          <button style={{
            width: "100%", height: 48, borderRadius: 12,
            background: "#2ECC71", border: "none",
            font: "700 14px/1 var(--ih-font-body)",
            color: "#fff", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(46,204,113,.35)",
            marginBottom: 20,
          }}>
            Solicitar Demonstração Gratuita
          </button>

          {/* LGPD Ready */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ font: "500 11px/1 var(--ih-font-body)", color: "#94A3B8" }}>
              LGPD Ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Hospital Image ─────────────────────────────────────────────────────────────
function HospitalImage() {
  return (
    <section style={{ position: "relative", height: 380, overflow: "hidden" }}>
      <Image
        src="/figma-landing-hero.png"
        alt="Hospital Santa Luzia"
        fill
        style={{ objectFit: "cover", objectPosition: "center 30%" }}
      />
      {/* Green overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(10,26,15,0.30) 0%, rgba(10,26,15,0.65) 100%)",
      }} />
      {/* Label */}
      <div style={{
        position: "absolute", bottom: 32, left: 64,
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.20)",
        borderRadius: 12, padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#2ECC71",
          boxShadow: "0 0 8px #2ECC71",
        }} />
        <span style={{ font: "600 13px/1 var(--ih-font-body)", color: "#fff" }}>
          Hospital Santa Luzia
        </span>
      </div>
    </section>
  );
}

// ── Architecture ──────────────────────────────────────────────────────────────
function Architecture() {
  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      ),
      title: "Resiliência de Dados",
      description: "Servidores redundantes com disponibilidade de 99,99% SLA. Backups automáticos em múltiplas regiões geográficas para garantir conformidade.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
      title: "Integração Universal",
      description: "API robusta e suporte a protocolos HL7 e FHIR. Conecte-se facilmente com equipamentos e softwares de gestão já consolidados na clínica.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: "Controle de Acesso",
      description: "Gestão de permissões granular por nível de cargo e setor. Logs de auditoria completos para monitoramento de todas as atividades clínicas.",
    },
  ];

  return (
    <section style={{ padding: "96px 0", background: "#fff" }}>
      <div style={C}>
        {/* Header */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{
            font: "700 40px/1.15 var(--ih-font-display)",
            letterSpacing: "-1.6px", margin: "0 0 16px",
            color: "#191C1D",
          }}>
            Arquitetura de Nível Empresarial
          </h2>
          <p style={{
            font: "400 16px/1.7 var(--ih-font-body)",
            color: "#6B7280", maxWidth: 580, margin: 0,
          }}>
            O InterHealth não é apenas um software: é uma base sólida para a evolução
            tecnológica da sua instituição, desenhada para escalar sem fricção.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {features.map(({ icon, title, description }) => (
            <div key={title} style={{
              background: "#FAFBFC",
              border: "1px solid #EAEDED",
              borderRadius: 18,
              padding: "28px 28px 32px",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "#EAFAF1",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
              }}>
                {icon}
              </div>
              <h3 style={{
                font: "700 17px/1.2 var(--ih-font-display)",
                color: "#191C1D", margin: "0 0 10px",
                letterSpacing: "-.3px",
              }}>
                {title}
              </h3>
              <p style={{
                font: "400 13px/1.65 var(--ih-font-body)",
                color: "#6B7280", margin: 0,
              }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section style={{ position: "relative", overflow: "hidden", background: "#0A1A0F" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Image
          src="/Formas abstratas.png"
          alt=""
          fill
          style={{ objectFit: "cover", opacity: 0.25 }}
        />
      </div>

      <div style={{ ...C, position: "relative", zIndex: 1, padding: "88px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <div>
            <h2 style={{
              font: "800 48px/1.1 var(--ih-font-display)",
              letterSpacing: "-2px", margin: "0 0 18px",
              color: "#fff",
            }}>
              Pronto para elevar o padrão de atendimento?
            </h2>
            <p style={{
              font: "400 15px/1.7 var(--ih-font-body)",
              color: "rgba(255,255,255,0.60)",
              maxWidth: 420, margin: "0 0 44px",
            }}>
              Nossos especialistas estão prontos para desenhar um plano
              personalizado que atenda às complexidades da sua organização.
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              <Link href="#" style={{
                display: "inline-flex", alignItems: "center",
                height: 52, padding: "0 28px", borderRadius: 13,
                background: "#2ECC71", color: "#fff",
                font: "700 15px/1 var(--ih-font-body)",
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(46,204,113,.40)",
              }}>
                Agendar uma Demo
              </Link>
              <Link href="#" style={{
                display: "inline-flex", alignItems: "center",
                height: 52, padding: "0 28px", borderRadius: 13,
                background: "transparent", color: "#fff",
                font: "700 15px/1 var(--ih-font-body)",
                textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.30)",
              }}>
                Ver Casos de Sucesso
              </Link>
            </div>
          </div>

          {/* Right — circuit graphic */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
            gap: 8, opacity: 0.35,
          }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} style={{
                height: 40, borderRadius: 6,
                background: i % 3 === 0 ? "#2ECC71" : i % 5 === 0 ? "#1A9B50" : "rgba(46,204,113,0.15)",
                border: "1px solid rgba(46,204,113,0.25)",
              }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "#fff",
      borderTop: "1px solid #F0F0F0",
      padding: "24px 48px",
    }}>
      <div style={{ ...C, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/miniLogoInterHealth.png" alt="InterHealth" width={28} height={28} />
          <div>
            <div style={{ font: "700 14px/1 var(--ih-font-display)", color: "#191C1D" }}>InterHealth</div>
            <div style={{ font: "400 11px/1.4 var(--ih-font-body)", color: "#94A3B8", marginTop: 3 }}>
              © 2026 InterHealth. Todos os direitos reservados.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/privacidade" style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", textDecoration: "none" }}>
            Privacidade
          </Link>
          <Link href="/termos" style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", textDecoration: "none" }}>
            Termos
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a href="#" style={{
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid #E7E8E9", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </a>
          <a href="#" style={{
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid #E7E8E9", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SolucaoPage() {
  return (
    <div style={{ fontFamily: "var(--ih-font-body)", color: "#191C1D", background: "#fff" }}>
      <Navbar />
      <Hero />
      <HospitalImage />
      <Architecture />
      <CTA />
      <Footer />
    </div>
  );
}
