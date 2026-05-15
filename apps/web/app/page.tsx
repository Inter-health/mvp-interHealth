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
              Começar Grátis — 14 Dias
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

          {/* Trust micro-copy — Nielsen #2: match real world */}
          <p style={{ font: "400 12px/1 var(--ih-font-body)", color: "#94A3B8", marginTop: 16, margin: "16px 0 0" }}>
            Sem cartão de crédito · Cancele a qualquer momento
          </p>
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

// ── Stats Strip — Nielsen #8: design estético com prova social ────────────────
function Stats() {
  const items = [
    { value: "500+", label: "Médicos ativos" },
    { value: "98%",  label: "Satisfação dos usuários" },
    { value: "50k+", label: "Consultas transcritas" },
    { value: "100%", label: "Conformidade LGPD" },
  ];
  return (
    <section style={{ background: "#F8FAF9", borderTop: "1px solid #EAEDED", borderBottom: "1px solid #EAEDED" }}>
      <div className="rsp-c rsp-grid" style={{ ...C, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "36px 48px" }}>
        {items.map((item, i) => (
          <div key={i} style={{
            textAlign: "center",
            padding: "0 24px",
            borderRight: i < items.length - 1 ? "1px solid #EAEDED" : "none",
          }}>
            <div style={{ font: "800 32px/1 var(--ih-font-display)", color: "#2ECC71", letterSpacing: "-1px" }}>
              {item.value}
            </div>
            <div style={{ font: "400 13px/1 var(--ih-font-body)", color: "#6B7280", marginTop: 8 }}>
              {item.label}
            </div>
          </div>
        ))}
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

// ── How It Works — Nielsen #6: reconhecimento > recordação ────────────────────
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Grave a Consulta",
      desc: "Inicie a gravação antes de entrar na sala. O InterHealth captura o áudio pelo app, sem equipamentos adicionais.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
    },
    {
      number: "02",
      title: "IA Transcreve e Analisa",
      desc: "Nossa IA com diarização automática identifica médico e paciente separadamente, gerando a transcrição em segundos.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
    },
    {
      number: "03",
      title: "Prontuário Gerado",
      desc: "O prontuário estruturado é preenchido automaticamente e fica disponível para revisão e assinatura digital.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="rsp-section" style={{ padding: "96px 0", background: "#F8FAF9" }}>
      <div className="rsp-c" style={C}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#EAFAF1", borderRadius: 20,
            padding: "6px 14px",
            font: "700 10px/1 var(--ih-font-body)",
            color: "#2ECC71", letterSpacing: "1.4px",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            Como Funciona
          </div>
          <h2 className="rsp-h2" style={{
            font: "700 38px/1.2 var(--ih-font-display)",
            letterSpacing: "-1.4px", margin: "0 0 14px",
            color: "#191C1D",
          }}>
            Do áudio ao prontuário em segundos
          </h2>
          <p style={{
            font: "400 16px/1.65 var(--ih-font-body)",
            color: "#6B7280", maxWidth: 480, margin: "0 auto",
          }}>
            Três passos para transformar cada consulta em documentação clínica precisa — sem retrabalho.
          </p>
        </div>

        <div className="rsp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 20,
              padding: "32px",
              border: "1px solid #EAEDED",
            }}>
              <div style={{
                font: "800 48px/1 var(--ih-font-display)",
                color: "#EAFAF1",
                letterSpacing: "-3px",
                marginBottom: 20,
                userSelect: "none",
              }}>
                {step.number}
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "#EAFAF1",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                {step.icon}
              </div>
              <h3 style={{
                font: "700 18px/1.3 var(--ih-font-display)",
                color: "#191C1D", margin: "0 0 10px",
              }}>
                {step.title}
              </h3>
              <p style={{
                font: "400 14px/1.65 var(--ih-font-body)",
                color: "#6B7280", margin: 0,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials — Nielsen #8: prova social reforça confiança ─────────────────
function Testimonials() {
  const reviews = [
    {
      name: "Dra. Ana Oliveira",
      specialty: "Cardiologista · São Paulo, SP",
      quote: "Reduzi em 70% o tempo de preenchimento de prontuários. Consigo atender mais pacientes sem sacrificar a qualidade da documentação clínica.",
      initials: "AO",
    },
    {
      name: "Dr. Carlos Mendes",
      specialty: "Clínico Geral · Belo Horizonte, MG",
      quote: "A transcrição é incrivelmente precisa para terminologia médica. É como ter um assistente clínico que nunca erra e nunca se cansa.",
      initials: "CM",
    },
    {
      name: "Dra. Beatriz Santos",
      specialty: "Neurologista · Rio de Janeiro, RJ",
      quote: "A conformidade LGPD já vem pronta. Não preciso me preocupar com compliance — posso focar 100% nos meus pacientes.",
      initials: "BS",
    },
  ];

  return (
    <section className="rsp-section" style={{ padding: "96px 0", background: "#fff" }}>
      <div className="rsp-c" style={C}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#EAFAF1", borderRadius: 20,
            padding: "6px 14px",
            font: "700 10px/1 var(--ih-font-body)",
            color: "#2ECC71", letterSpacing: "1.4px",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            Depoimentos
          </div>
          <h2 className="rsp-h2" style={{
            font: "700 38px/1.2 var(--ih-font-display)",
            letterSpacing: "-1.4px", margin: "0 0 14px",
            color: "#191C1D",
          }}>
            O que os médicos dizem
          </h2>
        </div>

        <div className="rsp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{
              background: "#F8FAF9",
              borderRadius: 20, padding: "32px",
              border: "1px solid #EAEDED",
              display: "flex", flexDirection: "column", gap: 24,
            }}>
              {/* Stars */}
              <div style={{ display: "flex", gap: 3 }}>
                {[...Array(5)].map((_, s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#2ECC71">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              {/* Quote */}
              <p style={{
                font: "400 15px/1.7 var(--ih-font-body)",
                color: "#374151", margin: 0, flex: 1,
              }}>
                &ldquo;{r.quote}&rdquo;
              </p>
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "#2ECC71",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  font: "700 14px/1 var(--ih-font-display)", color: "#fff",
                  flexShrink: 0,
                }}>
                  {r.initials}
                </div>
                <div>
                  <div style={{ font: "700 14px/1.2 var(--ih-font-display)", color: "#191C1D" }}>{r.name}</div>
                  <div style={{ font: "400 12px/1 var(--ih-font-body)", color: "#94A3B8", marginTop: 4 }}>{r.specialty}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const freeFeatures = [
    "Acesso completo à plataforma",
    "Transcrição de até 5 consultas",
    "Prontuários básicos",
    "Suporte via e-mail",
    "Exportação em PDF",
  ];
  const clinicoFeatures = [
    "Transcrições ilimitadas",
    "Prontuário personalizado",
    "Agendas integradas",
    "Integração com EHR",
    "Análise preditiva de pacientes",
    "Suporte prioritário 24h",
  ];
  const hospitalarFeatures = [
    "Múltiplos especialistas",
    "Análises avançadas de dados",
    "SLA garantido",
    "Integração customizada",
    "Painel administrativo centralizado",
  ];

  const Check = ({ white = false }: { white?: boolean }) => (
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
            color: "#6B7280", maxWidth: 460, margin: "0 auto 16px",
          }}>
            Escolha o plano que mais se adapta ao seu espaço e às suas consultas.
          </p>
          {/* Annual savings note */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#EAFAF1", borderRadius: 20,
            padding: "6px 14px",
            font: "600 12px/1 var(--ih-font-body)", color: "#1A9B50",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Economize 20% no plano anual
          </div>
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
              {freeFeatures.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "#556158" }}>
                  <Check /> {f}
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

          {/* Plano Clínico — destacado */}
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
              Mais Popular
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
              Cobrado mensalmente · ou R$ 95,92/mês anual
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {clinicoFeatures.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "rgba(255,255,255,0.92)" }}>
                  <Check white /> {f}
                </li>
              ))}
            </ul>
            {/* Guarantee note */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px",
              marginBottom: 20,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style={{ font: "500 12px/1.3 var(--ih-font-body)", color: "rgba(255,255,255,0.85)" }}>
                Garantia de reembolso de 30 dias
              </span>
            </div>
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

          {/* Plano Hospitalar */}
          <div style={{
            background: "#fff", borderRadius: 20,
            padding: "32px", border: "1px solid #EAEDED",
          }}>
            <div style={{ font: "500 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 10 }}>
              Plano Hospitalar
            </div>
            <div style={{ font: "800 38px/1.1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-1.5px", margin: "0 0 6px" }}>
              Sob Consulta
            </div>
            <div style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", marginBottom: 30 }}>
              Preços personalizados por volume
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {hospitalarFeatures.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, font: "400 14px/1.35 var(--ih-font-body)", color: "#556158" }}>
                  <Check /> {f}
                </li>
              ))}
            </ul>
            <Link href="/solucao" style={{
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

// ── Pricing FAQ — Nielsen #10: ajuda e documentação ───────────────────────────
function PricingFAQ() {
  const faqs = [
    {
      q: "Preciso de cartão de crédito para o teste gratuito?",
      a: "Não. O período de 14 dias é totalmente gratuito, sem necessidade de dados de pagamento. Após o período, você escolhe se quer assinar.",
    },
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim. Sem fidelidade ou multa. Cancele com um clique no painel e sua conta permanece ativa até o fim do período pago.",
    },
    {
      q: "Os dados dos meus pacientes ficam seguros?",
      a: "Todos os dados são armazenados em servidores no Brasil (São Paulo) com criptografia AES-256. Conformidade total com a LGPD e padrões CFM.",
    },
    {
      q: "O que inclui o Plano Hospitalar?",
      a: "O Plano Hospitalar é personalizado para clínicas e hospitais com múltiplos especialistas. Entre em contato para uma proposta adequada ao seu volume de atendimento.",
    },
    {
      q: "Posso trocar de plano depois?",
      a: "Sim. Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Cobranças são ajustadas proporcionalmente ao período restante.",
    },
  ];

  return (
    <section className="rsp-section" style={{ padding: "80px 0", background: "#F8FAF9", borderTop: "1px solid #EAEDED" }}>
      <div className="rsp-c" style={{ ...C, maxWidth: 720 }}>
        <h2 className="rsp-h2" style={{
          font: "700 32px/1.2 var(--ih-font-display)",
          letterSpacing: "-1px", margin: "0 0 48px",
          color: "#191C1D", textAlign: "center",
        }}>
          Perguntas Frequentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((faq, i) => (
            <details key={i} className="ih-faq-item">
              <summary style={{
                padding: "20px 24px",
                cursor: "pointer",
                font: "600 15px/1.4 var(--ih-font-body)",
                color: "#191C1D",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                userSelect: "none",
              }}>
                {faq.q}
                <svg className="ih-faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: "transform 0.2s ease" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </summary>
              <div style={{
                padding: "0 24px 20px",
                font: "400 14px/1.7 var(--ih-font-body)",
                color: "#6B7280",
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Compliance — expandida com 4 badges ───────────────────────────────────────
function Compliance() {
  const badges = [
    {
      iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      title: "LGPD",
      desc: "Lei Geral de Proteção de Dados",
    },
    {
      iconPath: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
      title: "CFM",
      desc: "Conselho Federal de Medicina",
    },
    {
      iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4",
      title: "AES-256",
      desc: "Criptografia de ponta a ponta",
    },
    {
      iconPath: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7v5l3 3",
      title: "Dados no Brasil",
      desc: "Servidores em São Paulo, SP",
    },
  ];

  return (
    <section className="rsp-section" style={{ padding: "96px 0", background: "#fff" }}>
      <div className="rsp-c" style={C}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            font: "700 10px/1 var(--ih-font-body)",
            color: "#94A3B8", letterSpacing: "2px",
            textTransform: "uppercase", marginBottom: 22,
          }}>
            Conformidade e Segurança
          </div>
          <h2 className="rsp-h2" style={{
            font: "700 34px/1.25 var(--ih-font-display)",
            letterSpacing: "-1px", margin: "0 0 14px",
            color: "#191C1D", maxWidth: 560,
            marginLeft: "auto", marginRight: "auto",
          }}>
            Privacidade que excede os padrões clínicos mundiais.
          </h2>
          <p style={{
            font: "400 16px/1.65 var(--ih-font-body)",
            color: "#6B7280", maxWidth: 460, margin: "0 auto",
          }}>
            Construído para a realidade do sistema de saúde brasileiro — do CFM à LGPD.
          </p>
        </div>

        <div className="rsp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center",
              padding: "28px 20px",
              border: "1px solid #EAEDED", borderRadius: 16,
              background: "#F8FAF9",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "#2ECC71",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={b.iconPath}/>
                </svg>
              </div>
              <div style={{ font: "700 14px/1 var(--ih-font-body)", color: "#191C1D", marginBottom: 6 }}>{b.title}</div>
              <div style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#94A3B8" }}>{b.desc}</div>
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
          Simplificamos a precisão para ampliar a clínica — junte-se a médicos
          que já transformaram sua rotina com o InterHealth.
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
            Começar Grátis — 14 Dias
          </Link>
          <Link href="/solucao" style={{
            display: "inline-flex", alignItems: "center",
            height: 52, padding: "0 30px", borderRadius: 13,
            background: "transparent", color: "#fff",
            font: "700 15px/1 var(--ih-font-body)",
            textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.30)",
          }}>
            Ver Demo Completo
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
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid #E7E8E9", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
          <a
            href="mailto:contato@interhealth.com.br"
            aria-label="E-mail"
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid #E7E8E9", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
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
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <PricingFAQ />
      <Compliance />
      <CTA />
      <Footer />
    </div>
  );
}
