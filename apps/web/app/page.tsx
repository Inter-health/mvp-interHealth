import Image from "next/image";
import Link from "next/link";
import PublicNavbar from "@/components/layout/PublicNavbar";

const C: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 48px",
  width: "100%",
};

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ paddingTop: 104, paddingBottom: 72, background: "#fff" }}>
      <div className="rsp-c rsp-grid" style={{ ...C, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>

        {/* Left — text */}
        <div>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#EAFAF1", borderRadius: 20,
            padding: "6px 14px",
            font: "700 10px/1 var(--ih-font-body)",
            color: "#2ECC71", letterSpacing: "1.4px",
            textTransform: "uppercase", marginBottom: 28,
          }}>
            Para Médicos Independentes
          </div>

          {/* Heading */}
          <h1 className="rsp-h1" style={{
            font: "800 68px/1.08 var(--ih-font-display)",
            letterSpacing: "-2.8px",
            margin: "0 0 22px",
            color: "#191C1D",
          }}>
            A Precisão<br />
            Empática<br />
            <span style={{ color: "#2ECC71" }}>ao seu Alcance</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            font: "400 16px/1.75 var(--ih-font-body)",
            color: "#6B7280",
            maxWidth: 460, margin: "0 0 36px",
          }}>
            Integre gestão clínica e análise de dados em uma interface editorial
            pensada para reduzir o ruído e priorizar o cuidado humano.
          </p>

          {/* Buttons */}
          <div className="rsp-flex-wrap" style={{ display: "flex", gap: 12 }}>
            <Link href="/cadastro" style={{
              display: "inline-flex", alignItems: "center",
              height: 48, padding: "0 26px", borderRadius: 12,
              background: "#2ECC71", color: "#fff",
              font: "700 15px/1 var(--ih-font-body)",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(46,204,113,.38)",
            }}>
              Começar Agora
            </Link>
            <Link href="/solucao" style={{
              display: "inline-flex", alignItems: "center",
              height: 48, padding: "0 26px", borderRadius: 12,
              background: "transparent", color: "#191C1D",
              font: "700 15px/1 var(--ih-font-body)",
              textDecoration: "none",
              border: "1.5px solid #D8E0E4",
            }}>
              Agendar Demo
            </Link>
          </div>
        </div>

        {/* Right — image + floating cards */}
        <div className="rsp-hide" style={{ position: "relative" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", lineHeight: 0 }}>
            <Image
              src="/figma-landing-hero.png"
              alt="Médico com paciente"
              width={620}
              height={500}
              style={{ width: "100%", height: "auto", display: "block" }}
              priority
            />
          </div>

          {/* Floating card — Vitality Chip */}
          <div style={{
            position: "absolute", bottom: 28, left: -24,
            background: "#fff", borderRadius: 16, padding: "14px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,.13)",
            maxWidth: 230,
            border: "1px solid #F0F0F0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "#EAFAF1",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div>
                <div style={{ font: "700 13px/1 var(--ih-font-display)", color: "#191C1D" }}>Vitality Chip</div>
                <div style={{ font: "400 11px/1 var(--ih-font-body)", color: "#94A3B8", marginTop: 3 }}>IA Clínica Ativa</div>
              </div>
            </div>
            <p style={{ font: "400 11px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
              Transcrição com diarização automática e insights em tempo real
            </p>
          </div>

          {/* Floating card — AI transcript snippet */}
          <div style={{
            position: "absolute", bottom: -16, right: -16,
            background: "#0D1F14", borderRadius: 14, padding: "12px 16px",
            boxShadow: "0 8px 28px rgba(0,0,0,.22)",
            maxWidth: 210,
          }}>
            <div style={{ font: "700 10px/1 var(--ih-font-body)", color: "#2ECC71", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
              Transcrição ao vivo
            </div>
            <p style={{ font: "400 11px/1.55 var(--ih-font-body)", color: "rgba(255,255,255,0.7)", margin: 0 }}>
              "…desconforto ao subir escadas. PA média 135×85 mmHg…"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="produto" className="rsp-section" style={{ padding: "96px 0", background: "#fff" }}>
      <div className="rsp-c" style={C}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h2 className="rsp-h2" style={{
            font: "700 38px/1.2 var(--ih-font-display)",
            letterSpacing: "-1.4px", margin: "0 0 14px",
            color: "#191C1D",
          }}>
            O Santuário Clínico para Independentes
          </h2>
          <p style={{
            font: "400 16px/1.65 var(--ih-font-body)",
            color: "#6B7280", maxWidth: 560, margin: 0,
          }}>
            Ferramentas de precisão que removem o ruído administrativo,
            permitindo que você foque no que realmente importa: a saúde.
          </p>
        </div>

        {/* Cards */}
        <div className="rsp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Prontuário Inteligente */}
          <div style={{
            background: "#0A1A0F", borderRadius: 20,
            padding: "32px 32px 0",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(255,255,255,0.08)", borderRadius: 20,
              padding: "5px 12px", alignSelf: "flex-start",
              font: "700 10px/1 var(--ih-font-body)",
              color: "rgba(255,255,255,0.5)", letterSpacing: "1.2px",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              Prontuário
            </div>
            <h3 style={{
              font: "700 22px/1.25 var(--ih-font-display)",
              color: "#fff", margin: "0 0 10px", letterSpacing: "-.4px",
            }}>
              Prontuário Inteligente
            </h3>
            <p style={{
              font: "400 14px/1.6 var(--ih-font-body)",
              color: "rgba(255,255,255,0.50)", margin: "0 0 28px",
            }}>
              Interface clínica que se adapta ao seu fluxo de trabalho.
              Registro de dados em segundos com suporte e IA.
            </p>
            <div style={{ borderRadius: "12px 12px 0 0", overflow: "hidden", marginTop: "auto" }}>
              <Image
                src="/Interface de prontuário inteligente.png"
                alt="Interface de prontuário inteligente"
                width={560}
                height={300}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>

          {/* Análise Preditiva */}
          <div style={{
            background: "#0A1A0F", borderRadius: 20,
            padding: "32px 32px 0",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(46,204,113,0.18)", borderRadius: 20,
              padding: "5px 12px", alignSelf: "flex-start",
              font: "700 10px/1 var(--ih-font-body)",
              color: "#2ECC71", letterSpacing: "1.2px",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              Inteligência Artificial
            </div>
            <h3 style={{
              font: "700 22px/1.25 var(--ih-font-display)",
              color: "#fff", margin: "0 0 10px", letterSpacing: "-.4px",
            }}>
              Análise Preditiva
            </h3>
            <p style={{
              font: "400 14px/1.6 var(--ih-font-body)",
              color: "rgba(255,255,255,0.50)", margin: "0 0 28px",
            }}>
              Identifique tendências de saúde dos seus pacientes antes mesmo
              dos sintomas aparecerem com nossos algoritmos.
            </p>
            <div style={{ borderRadius: "12px 12px 0 0", overflow: "hidden", marginTop: "auto" }}>
              <Image
                src="/Análise de dados de saúde.png"
                alt="Análise de dados de saúde"
                width={560}
                height={300}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const freatures = [
    "Acesso completo à plataforma",
    "Transcrição de até 5 consultas",
    "Prontuários básicos",
    "Suporte via e-mail",
  ];
  const clinico = [
    "Agendas integradas",
    "Prontuário personalizado",
    "Transcrições ilimitadas",
    "Integração com EHR",
  ];
  const hospitalar = [
    "Análises avançadas de dados",
    "Múltiplos especialistas",
    "SLA garantido",
    "Integração customizada",
  ];

  const checkIcon = (white = false) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={white ? "#fff" : "#2ECC71"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  return (
    <section id="precos" className="rsp-section" style={{ padding: "96px 0", background: "#fff" }}>
      <div className="rsp-c" style={C}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 className="rsp-h2" style={{
            font: "700 38px/1.2 var(--ih-font-display)",
            letterSpacing: "-1.4px", margin: "0 0 14px",
            color: "#191C1D",
          }}>
            Investimento na sua Liberdade
          </h2>
          <p style={{
            font: "400 16px/1.65 var(--ih-font-body)",
            color: "#6B7280", maxWidth: 460, margin: "0 auto",
          }}>
            Escolha o plano que mais se adapta ao seu espaço e às suas consultas.
          </p>
        </div>

        <div className="rsp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Teste Gratuito */}
          <div style={{
            background: "#fff", borderRadius: 20,
            padding: "32px", border: "1px solid #EAEDED",
          }}>
            <div style={{ font: "500 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 10 }}>
              Teste Gratuito
            </div>
            <div style={{ font: "800 52px/1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-2.5px", margin: "0 0 6px" }}>
              14 Dias
            </div>
            <div style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 30 }}>
              Sem cartão de crédito
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {freatures.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "#556158" }}>
                  {checkIcon()} {f}
                </li>
              ))}
            </ul>
            <Link href="/cadastro" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 46, borderRadius: 11, border: "1.5px solid #D8E0E4",
              font: "700 14px/1 var(--ih-font-body)", color: "#191C1D",
              textDecoration: "none",
            }}>
              Começar Grátis
            </Link>
          </div>

          {/* Plano Clínico — highlighted */}
          <div style={{
            borderRadius: 20, padding: "38px 32px 32px",
            background: "linear-gradient(160deg, #2ECC71 0%, #1A9B50 100%)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
              background: "#191C1D", color: "#fff",
              font: "700 10px/1 var(--ih-font-body)",
              letterSpacing: "1.6px", textTransform: "uppercase",
              padding: "6px 18px", borderRadius: 20,
              whiteSpace: "nowrap",
            }}>
              Popular
            </div>
            <div style={{ font: "500 13px/1 var(--ih-font-body)", color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>
              Plano Clínico
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "0 0 6px" }}>
              <span style={{ font: "800 40px/1 var(--ih-font-display)", color: "#fff", letterSpacing: "-1.5px" }}>
                R$ 119,90
              </span>
              <span style={{ font: "400 13px/1 var(--ih-font-body)", color: "rgba(255,255,255,0.7)" }}>
                /mês
              </span>
            </div>
            <div style={{ font: "400 13px/1 var(--ih-font-body)", color: "rgba(255,255,255,0.65)", marginBottom: 30 }}>
              Cobrado mensalmente
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {clinico.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "rgba(255,255,255,0.92)" }}>
                  {checkIcon(true)} {f}
                </li>
              ))}
            </ul>
            <Link href="/cadastro" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 46, borderRadius: 11, background: "#fff",
              font: "700 14px/1 var(--ih-font-body)", color: "#191C1D",
              textDecoration: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,.10)",
            }}>
              Experimentar Agora
            </Link>
          </div>

          {/* Planos Hospitalar */}
          <div style={{
            background: "#fff", borderRadius: 20,
            padding: "32px", border: "1px solid #EAEDED",
          }}>
            <div style={{ font: "500 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 10 }}>
              Planos Hospitalar
            </div>
            <div style={{ font: "800 38px/1.1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-1.5px", margin: "0 0 6px" }}>
              Sob Consulta
            </div>
            <div style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 30 }}>
              Preços personalizados
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {hospitalar.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "#556158" }}>
                  {checkIcon()} {f}
                </li>
              ))}
            </ul>
            <Link href="#" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 46, borderRadius: 11, border: "1.5px solid #D8E0E4",
              font: "700 14px/1 var(--ih-font-body)", color: "#191C1D",
              textDecoration: "none",
            }}>
              Falar com Vendas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Compliance ────────────────────────────────────────────────────────────────
function Compliance() {
  return (
    <section style={{ padding: "80px 0", background: "#fff" }}>
      <div style={{ ...C, textAlign: "center" }}>
        <div style={{
          font: "700 10px/1 var(--ih-font-body)",
          color: "#94A3B8", letterSpacing: "2px",
          textTransform: "uppercase", marginBottom: 22,
        }}>
          Conformidade e Segurança
        </div>
        <h2 style={{
          font: "700 34px/1.25 var(--ih-font-display)",
          letterSpacing: "-1px", margin: "0 0 36px",
          color: "#191C1D", maxWidth: 560,
          marginLeft: "auto", marginRight: "auto",
        }}>
          Privacidade que excede os padrões clínicos mundiais.
        </h2>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "12px 22px", borderRadius: 14,
          border: "1px solid #EAEDED", background: "#F8FAFC",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "#2ECC71",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ font: "700 13px/1 var(--ih-font-body)", color: "#191C1D" }}>LGPD</div>
            <div style={{ font: "400 11px/1.3 var(--ih-font-body)", color: "#94A3B8", marginTop: 2 }}>
              Lei Geral de Proteção de Dados
            </div>
          </div>
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
      <div className="rsp-c" style={{ ...C, position: "relative", zIndex: 1, textAlign: "center", padding: "88px 48px" }}>
        <h2 className="rsp-h2-cta" style={{
          font: "800 52px/1.1 var(--ih-font-display)",
          letterSpacing: "-2.2px", margin: "0 0 18px",
          color: "#fff",
        }}>
          Pronto para transformar<br />sua prática clínica?
        </h2>
        <p style={{
          font: "400 16px/1.7 var(--ih-font-body)",
          color: "rgba(255,255,255,0.60)",
          maxWidth: 500, margin: "0 auto 44px",
        }}>
          Simplificamos a precisão para ampliar a clínica — junte-se a milhares de
          médicos que já transformaram sua rotina.
        </p>
        <div className="rsp-flex-wrap" style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <Link href="/cadastro" style={{
            display: "inline-flex", alignItems: "center",
            height: 52, padding: "0 30px", borderRadius: 13,
            background: "#2ECC71", color: "#fff",
            font: "700 15px/1 var(--ih-font-body)",
            textDecoration: "none",
            boxShadow: "0 4px 18px rgba(46,204,113,.40)",
          }}>
            Começar Teste Grátis
          </Link>
          <Link href="#" style={{
            display: "inline-flex", alignItems: "center",
            height: 52, padding: "0 30px", borderRadius: 13,
            background: "transparent", color: "#fff",
            font: "700 15px/1 var(--ih-font-body)",
            textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.30)",
          }}>
            Ver Vídeo Demo
          </Link>
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
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--ih-font-body)", color: "#191C1D", background: "#fff" }}>
      <PublicNavbar />
      <Hero />
      <Features />
      <Pricing />
      <Compliance />
      <CTA />
      <Footer />
    </div>
  );
}
