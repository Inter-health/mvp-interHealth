"use client";

import { useState } from "react";

const LABEL: React.CSSProperties = {
  display: "block",
  font: "700 10px/1 var(--ih-font-body)",
  color: "#94A3B8",
  letterSpacing: "1.2px",
  textTransform: "uppercase",
  marginBottom: 8,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  padding: "0 14px",
  font: "400 14px/1 var(--ih-font-body)",
  color: "#191C1D",
  outline: "none",
  boxSizing: "border-box",
  background: "#FAFAFA",
};

const SELECT: React.CSSProperties = {
  ...INPUT,
  appearance: "none",
};

export default function DemoForm() {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("Clínico");
  const [doctorCount, setDoctorCount] = useState("1 – 10");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/demo-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: companyName,
            role,
            doctor_count: doctorCount,
            email,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Erro ao enviar solicitação."
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 16, minHeight: 300,
        textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#EAFAF1",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{
          font: "700 18px/1.3 var(--ih-font-display)",
          color: "#191C1D", margin: 0,
        }}>
          Solicitação enviada!
        </h3>
        <p style={{
          font: "400 14px/1.6 var(--ih-font-body)",
          color: "#6B7280", margin: 0, maxWidth: 280,
        }}>
          Nossa equipe entrará em contato com você em até 1 dia útil.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Nome da Empresa</label>
        <input
          type="text"
          placeholder="Ex: Hospital Santa Luzia"
          required
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          style={INPUT}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={LABEL}>Cargo</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={SELECT}>
            <option>Clínico</option>
            <option>Diretor</option>
            <option>Gestor</option>
            <option>CEO</option>
            <option>TI</option>
          </select>
        </div>
        <div>
          <label style={LABEL}>Nº de Médicos</label>
          <select value={doctorCount} onChange={e => setDoctorCount(e.target.value)} style={SELECT}>
            <option>1 – 10</option>
            <option>11 – 50</option>
            <option>51 – 200</option>
            <option>200+</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={LABEL}>E-mail Corporativo</label>
        <input
          type="email"
          placeholder="seu@hospital.com.br"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={INPUT}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "#FEF2F2", border: "1px solid #FECACA",
          font: "400 13px/1.4 var(--ih-font-body)", color: "#DC2626",
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", height: 48, borderRadius: 12,
          background: loading ? "#86EFAC" : "#2ECC71",
          border: "none",
          font: "700 14px/1 var(--ih-font-body)",
          color: "#fff", cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 16px rgba(46,204,113,.35)",
          marginBottom: 20,
          transition: "background 200ms",
        }}
      >
        {loading ? "Enviando…" : "Solicitar Demonstração Gratuita"}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ font: "500 11px/1 var(--ih-font-body)", color: "#94A3B8" }}>
          LGPD Ready
        </span>
      </div>
    </form>
  );
}
