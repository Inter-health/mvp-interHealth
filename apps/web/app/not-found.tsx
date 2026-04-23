"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

/* ─────────────────────────────────────────────
   Leaf mark — two overlapping blobs (só o ícone)
───────────────────────────────────────────── */
function LeafMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 100" fill="none">
      {/* blob traseiro — lime */}
      <path
        d="M72 90V52c-2.6-16.5-14-20-20-19.5H27C6.5 32.5-2 68 26 70 25.2 95.5 57 101.5 72 90z"
        fill="#8AED06"
      />
      {/* blob dianteiro — teal */}
      <path
        d="M50 10v38c2.6 16.5 14 20 20 19.5h25c20.5 0 29-35.5 1-37.5C96.8 4.5 65-1.5 50 10z"
        fill="#01E37F"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Header de landing (apenas não-autenticados)
───────────────────────────────────────────── */
function LandingHeader() {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: 64, background: "#fff",
      borderBottom: "1px solid #F0F0F0",
      display: "flex", alignItems: "center", padding: "0 40px",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <LeafMark size={34} />
        <span style={{ font: "700 16px/1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.3px" }}>
          InterHealth
        </span>
      </Link>

      {/* Nav centrada */}
      <nav style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 36 }}>
        <Link href="/"       style={{ font: "600 14px/1 var(--ih-font-body)", color: "#191C1D", textDecoration: "none" }}>Home</Link>
        <Link href="/suporte" style={{ font: "500 14px/1 var(--ih-font-body)", color: "#6B7280", textDecoration: "none" }}>Suporte</Link>
      </nav>

      {/* CTA */}
      <Link href="/cadastro" style={{
        marginLeft: "auto",
        display: "inline-flex", alignItems: "center",
        height: 40, padding: "0 22px", borderRadius: 10,
        background: "#2ECC71", color: "#fff",
        font: "700 14px/1 var(--ih-font-body)",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(46,204,113,.35)",
      }}>
        Começar Agora
      </Link>
    </header>
  );
}

/* ─────────────────────────────────────────────
   Footer de landing (apenas não-autenticados)
───────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer style={{
      borderTop: "1px solid #F0F0F0",
      padding: "28px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#fff",
    }}>
      {/* Logo + copyright */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LeafMark size={30} />
        <div>
          <div style={{ font: "700 14px/1 var(--ih-font-display)", color: "#191C1D" }}>InterHealth</div>
          <div style={{ font: "400 11px/1.5 var(--ih-font-body)", color: "#94A3B8", marginTop: 3 }}>
            © 2026 InterHealth. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: 24 }}>
        <Link href="/privacidade" style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", textDecoration: "none" }}>Privacidade</Link>
        <Link href="/termos"      style={{ font: "400 13px/1 var(--ih-font-body)", color: "#94A3B8", textDecoration: "none" }}>Termos</Link>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 8 }}>
        <IconBtn>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </IconBtn>
        <IconBtn>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
          </svg>
        </IconBtn>
      </div>
    </footer>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      width: 34, height: 34, borderRadius: 8,
      border: "1px solid #E7E8E9", background: "#fff",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Conteúdo 404 (compartilhado)
───────────────────────────────────────────── */
function NotFoundContent({ authenticated }: { authenticated: boolean }) {
  const backHref  = authenticated ? "/dashboard" : "/";
  const backLabel = authenticated ? "Voltar para o Painel" : "Voltar para o Início";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: authenticated ? "60px 24px 48px" : "100px 24px 48px",
      gap: 0,
      minHeight: authenticated ? "100vh" : "auto",
    }}>

      {/* ── App icon card + glow ── */}
      <div style={{ position: "relative", marginBottom: 44 }}>
        {/* glow blob */}
        <div style={{
          position: "absolute",
          width: 380, height: 320,
          top: "50%", left: "50%",
          transform: "translate(-50%, -40%)",
          background: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(46,204,113,.14) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}/>
        {/* card */}
        <div style={{
          position: "relative", zIndex: 1,
          width: 128, height: 128, borderRadius: 22,
          background: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LeafMark size={68} />
        </div>
      </div>

      {/* ── 404 + Diagnóstico ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 28,
        marginBottom: 44,
      }}>
        {/* Número 404 — cinza médio visível */}
        <span style={{
          fontFamily: "var(--ih-font-display)",
          fontWeight: 800,
          fontSize: 104,
          lineHeight: 1,
          color: "#BBC5CC",          /* cinza médio — visível mas subdued */
          letterSpacing: "-4px",
          userSelect: "none",
        }}>
          404
        </span>

        {/* Divisor vertical */}
        <div style={{
          width: 1.5,
          height: 64,
          background: "#D8E0E4",
          borderRadius: 2,
          flexShrink: 0,
        }}/>

        {/* Diagnóstico */}
        <div style={{ textAlign: "left" }}>
          <div style={{
            fontFamily: "var(--ih-font-display)",
            fontWeight: 700,
            fontSize: 17,
            color: "#2ECC71",
            marginBottom: 7,
            letterSpacing: "-.1px",
          }}>
            Diagnóstico:
          </div>
          <div style={{
            fontFamily: "var(--ih-font-body)",
            fontWeight: 400,
            fontSize: 15,
            color: "#6B7280",
            lineHeight: 1.4,
          }}>
            Recurso não localizado
          </div>
        </div>
      </div>

      {/* ── Heading ── */}
      <h1 style={{
        fontFamily: "var(--ih-font-display)",
        fontWeight: 800,
        fontSize: 40,
        lineHeight: 1.15,
        color: "#191C1D",
        letterSpacing: "-1.5px",
        margin: "0 0 16px",
      }}>
        Página não encontrada
      </h1>

      {/* ── Subtítulo ── */}
      <p style={{
        fontFamily: "var(--ih-font-body)",
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 1.65,
        color: "#6B7280",
        maxWidth: 530,
        margin: "0 0 44px",
      }}>
        Ops! Parece que o prontuário ou a página que você procura não existe
        ou foi movida. Verifique o link ou retorne à central de atendimento.
      </p>

      {/* ── Botões ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 68 }}>
        {/* Voltar — verde sólido */}
        <Link href={backHref} style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          height: 50, padding: "0 28px", borderRadius: 13,
          background: "#2ECC71", color: "#fff",
          fontFamily: "var(--ih-font-body)", fontWeight: 700, fontSize: 15,
          textDecoration: "none",
          boxShadow: "0 4px 16px rgba(46,204,113,.38)",
        }}>
          {/* grid 2×2 icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.2"/>
            <rect x="14" y="3" width="7" height="7" rx="1.2"/>
            <rect x="14" y="14" width="7" height="7" rx="1.2"/>
            <rect x="3" y="14" width="7" height="7" rx="1.2"/>
          </svg>
          {backLabel}
        </Link>

        {/* Suporte Técnico — ghost */}
        <Link href="/suporte" style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          height: 50, padding: "0 28px", borderRadius: 13,
          background: "#fff", color: "#191C1D",
          fontFamily: "var(--ih-font-body)", fontWeight: 700, fontSize: 15,
          textDecoration: "none",
          border: "1.5px solid #E0E7EA",
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        }}>
          {/* círculo com ? */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191C1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <circle cx="12" cy="17" r=".5" fill="#191C1D"/>
          </svg>
          Suporte Técnico
        </Link>
      </div>

      {/* ── 3 cards com ícones médicos ── */}
      <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
        {/* estetoscópio + coração */}
        <MedCard>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2.5A.5.5 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.5.5 0 10.5.5"/>
            <path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/>
            <circle cx="20" cy="10" r="2"/>
            <path d="M9 8.5c.5-1 2-1 2 .5 0 1.5-2 2-2 2s-2-.5-2-2c0-1.5 1.5-1.5 2-.5z"/>
          </svg>
        </MedCard>

        {/* monitor ECG + coração */}
        <MedCard>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 10h1l1.5-3 2 6 1.5-3H16"/>
            <path d="M9 21h6M12 17v4"/>
            <path d="M14.5 19c.5-1 2-1 2 .5 0 1-1 1.5-2 1.5s-2-.5-2-1.5c0-1.5 1.5-1.5 2-.5z"/>
          </svg>
        </MedCard>

        {/* prontuário + pessoa */}
        <MedCard>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2h6a1 1 0 011 1v1H8V3a1 1 0 011-1z"/>
            <path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
            <circle cx="12" cy="11" r="2.5"/>
            <path d="M7.5 20c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
          </svg>
        </MedCard>
      </div>

    </div>
  );
}

function MedCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 185, height: 105,
      background: "#fff",
      border: "1px solid #EAEDED",
      borderRadius: 16,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Export principal
───────────────────────────────────────────── */
export default function NotFound() {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setAuth(!!localStorage.getItem("access_token"));
  }, []);

  if (auth === null) return null; // evita flash

  if (auth) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <NotFoundContent authenticated />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fff" }}>
      <LandingHeader />
      <div style={{ flex: 1, paddingTop: 64 }}>
        <NotFoundContent authenticated={false} />
      </div>
      <LandingFooter />
    </div>
  );
}
