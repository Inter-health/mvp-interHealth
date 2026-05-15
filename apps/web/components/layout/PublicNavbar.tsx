"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  activePage?: "solucao";
}

const links = [
  { label: "Produto",  href: "/#produto", key: "produto"  },
  { label: "Solução",  href: "/solucao",  key: "solucao"  },
  { label: "Preços",   href: "/#precos",  key: "precos"   },
];

const DURATION = "280ms";
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function PublicNavbar({ activePage }: Props) {
  const [open, setOpen] = useState(false);

  // Nielsen #3: controle do usuário — fechar menu com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #EAEDED",
      }}>
        <div className="pub-nav-header" style={{
          height: "100%", display: "flex", alignItems: "center",
          maxWidth: 1200, margin: "0 auto",
          padding: "0 64px", width: "100%", boxSizing: "border-box",
        }}>

          {/* Logo */}
          <Link href="/" className="pub-nav-logo" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <Image src="/miniLogoInterHealth.png" alt="InterHealth" width={30} height={30} />
            <span className="pub-nav-links" style={{ font: "700 15px/1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.2px" }}>
              InterHealth
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="pub-nav-links" style={{ gap: 32, marginLeft: 52 }}>
            {links.map(({ label, href, key }) => {
              const active = activePage === key;
              return (
                <Link key={key} href={href} style={{
                  font: "500 14px/1 var(--ih-font-body)",
                  color: "#556158",
                  textDecoration: active ? "underline" : "none",
                  textDecorationColor: "#2ECC71",
                  textUnderlineOffset: "4px",
                  textDecorationThickness: "2px",
                }}>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="pub-nav-links" style={{ marginLeft: "auto", alignItems: "center", gap: 20 }}>
            <Link href="/login" style={{ font: "500 14px/1 var(--ih-font-body)", color: "#191C1D", textDecoration: "none" }}>
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

          {/* Mobile hamburger */}
          <button
            className="pub-nav-mobile"
            onClick={() => setOpen(true)}
            style={{
              marginRight: "auto",
              background: "none", border: "none", cursor: "pointer",
              padding: 8, borderRadius: 8,
              alignItems: "center", justifyContent: "center",
            }}
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191C1D" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Overlay — always rendered, visibility controlled by opacity + pointerEvents */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Backdrop */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          transition: `opacity ${DURATION} ease`,
        }} />

        {/* Sidebar */}
        <aside
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            width: 280,
            background: "#fff",
            display: "flex", flexDirection: "column",
            padding: "24px 28px",
            boxShadow: "4px 0 32px rgba(0,0,0,.15)",
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: `transform ${DURATION} ${EASE}`,
          }}
        >
          {/* Top row: logo + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
            <Link href="/" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <Image src="/miniLogoInterHealth.png" alt="InterHealth" width={28} height={28} />
              <span style={{ font: "700 15px/1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.2px" }}>
                InterHealth
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 6, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Fechar menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191C1D" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {links.map(({ label, href, key }) => {
              const active = activePage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  style={{
                    font: "500 16px/1 var(--ih-font-body)",
                    color: "#191C1D",
                    textDecoration: "none",
                    padding: "14px 12px",
                    borderRadius: 10,
                    background: active ? "#EAFAF1" : "transparent",
                    borderLeft: active ? "3px solid #2ECC71" : "3px solid transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 24, borderTop: "1px solid #F0F0F0" }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 46, borderRadius: 11, border: "1.5px solid #D8E0E4",
              font: "600 14px/1 var(--ih-font-body)", color: "#191C1D",
              textDecoration: "none",
            }}>
              Login
            </Link>
            <Link href="/cadastro" onClick={() => setOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 46, borderRadius: 11,
              background: "#2ECC71", color: "#fff",
              font: "700 14px/1 var(--ih-font-body)",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(46,204,113,.35)",
            }}>
              Começar Agora
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
