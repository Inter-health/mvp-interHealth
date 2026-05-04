"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";
import { apiFetch } from "@/lib/api";
import type { ConsultationListItem, User } from "@/lib/types";

const STATUS_MAP: Record<string, { label: string; tone: "green" | "slate" | "greenSoft" | "red" | "yellow" }> = {
  PENDING:     { label: "Aguardando",   tone: "slate" },
  PROCESSING:  { label: "Transcrevendo", tone: "yellow" },
  TRANSCRIBED: { label: "Pronta",        tone: "green" },
  ERROR:       { label: "Erro",          tone: "red" },
};

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function OnboardingCard({ onComplete }: { onComplete: (user: User) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [ehrProvider, setEhrProvider] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crm, specialty, ehrProvider }),
      });
      if (res.ok) {
        const updated: User = await res.json();
        onComplete(updated);
      } else {
        setError("Não foi possível salvar. Tente novamente.");
      }
    } catch (err) {
      console.error("[OnboardingCard] erro ao salvar:", err);
      setError(err instanceof Error ? err.message : "Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      borderRadius: 16,
      border: "1px solid #D1FAE5",
      background: "#F0FDF4",
      padding: expanded ? 28 : 24,
      transition: "padding 200ms ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(46,204,113,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="users" size={20} color="#2ECC71" />
          </div>
          <div>
            <div style={{ font: "600 15px/1.3 var(--ih-font-body)", color: "#14532D" }}>
              Complete seu perfil médico
            </div>
            <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#15803D", marginTop: 2 }}>
              Adicione seu CRM e especialidade para personalizar a plataforma.
            </div>
          </div>
        </div>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              height: 36, padding: "0 16px", borderRadius: 8,
              background: "#2ECC71", color: "#fff",
              font: "600 13px/1 var(--ih-font-body)", border: "none", cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Completar agora
          </button>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSave} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ font: "500 13px/1 var(--ih-font-body)", color: "#14532D" }}>
                Registro Médico (CRM)
              </label>
              <input
                type="text"
                placeholder="CRM/UF 000000"
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                required
                style={{
                  height: 44, borderRadius: 8, border: "1px solid #BBF7D0",
                  background: "#fff", padding: "0 14px",
                  font: "400 14px/1 var(--ih-font-body)", color: "#1A1C1B",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ font: "500 13px/1 var(--ih-font-body)", color: "#14532D" }}>
                Especialidade
              </label>
              <input
                type="text"
                placeholder="Ex: Cardiologia"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                style={{
                  height: 44, borderRadius: 8, border: "1px solid #BBF7D0",
                  background: "#fff", padding: "0 14px",
                  font: "400 14px/1 var(--ih-font-body)", color: "#1A1C1B",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "500 13px/1 var(--ih-font-body)", color: "#14532D" }}>
              Sistema clínico (EHR) — opcional
            </label>
            <select
              value={ehrProvider}
              onChange={(e) => setEhrProvider(e.target.value)}
              style={{
                height: 44, borderRadius: 8, border: "1px solid #BBF7D0",
                background: "#fff", padding: "0 14px",
                font: "400 14px/1 var(--ih-font-body)", color: ehrProvider ? "#1A1C1B" : "#9CA3AF",
                outline: "none", appearance: "none",
              }}
            >
              <option value="">Selecione seu sistema (opcional)</option>
              <option value="iclinic">iClinic</option>
              <option value="feegow">Feegow</option>
              <option value="other">Outro</option>
            </select>
          </div>

          {error && (
            <p style={{ font: "400 13px/1 var(--ih-font-body)", color: "#DC2626" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                height: 40, padding: "0 16px", borderRadius: 8,
                background: "transparent", color: "#15803D",
                font: "500 13px/1 var(--ih-font-body)",
                border: "1px solid #86EFAC", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 40, padding: "0 20px", borderRadius: 8,
                background: saving ? "#86EFAC" : "#2ECC71", color: "#fff",
                font: "600 13px/1 var(--ih-font-body)", border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Salvando…" : "Salvar perfil"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayLabel, setTodayLabel] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  async function fetchData() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [userRes, consultRes] = await Promise.all([
        apiFetch("/users/me"),
        apiFetch("/consultations"),
      ]);
      if (userRes.ok) {
        const u: User = await userRes.json();
        setUser(u);
        localStorage.setItem("ih_user_crm", u.crm ?? "");
        if (!u.crm) setShowOnboarding(true);
      }
      if (consultRes.ok) setConsultations(await consultRes.json());
    } catch {
      // apiFetch já redireciona para /login se 401
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    setTodayLabel(new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  useEffect(() => {
    const hasInProgress = consultations.some(
      (c) => c.status === "PENDING" || c.status === "PROCESSING"
    );
    if (hasInProgress && !pollingRef.current) {
      pollingRef.current = setInterval(fetchData, 5000);
    }
    if (!hasInProgress && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [consultations]);

  const recent = consultations.slice(0, 5);

  function handleCompleteOnboarding(updated: User) {
    setUser(updated);
    setShowOnboarding(false);
    localStorage.setItem("ih_user_crm", updated.crm ?? "");
    window.dispatchEvent(new Event("ih_crm_updated"));
  }


  const transcribed = consultations.filter((c) => c.status === "TRANSCRIBED").length;
  const inProgress  = consultations.filter((c) => c.status === "PENDING" || c.status === "PROCESSING").length;

  const kpis = [
    { icon: "mic" as const,      label: "Em andamento",       value: String(inProgress),   hint: "aguardando transcrição", green: inProgress > 0 },
    { icon: "users" as const,    label: "Total de consultas", value: String(consultations.length), hint: "registradas", green: false },
    { icon: "activity" as const, label: "Transcritas",        value: String(transcribed),  hint: "prontas para revisão",  green: false },
    { icon: "clock" as const,    label: "Hoje",               value: String(consultations.filter((c) => new Date(c.created_at).toDateString() === new Date().toDateString()).length), hint: "consultas hoje", green: false },
  ];

  const doctorName = user
    ? `Dr${user.name.includes("Dra") ? "a" : "."} ${user.name.replace(/^Dr[a.]?\s*/i, "")}`
    : "...";

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div style={{
        borderRadius: 16,
        background: "linear-gradient(180deg,#2ECC71 0%,#27AE60 100%)",
        padding: 40,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,.05)",
      }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", right: 20, top: 10, opacity: .25 }} fill="none">
          <path d="M100 170V100c5-30 25-35 35-33h45c35 0 50 65 -5 70 2 45-55 55-75 33z" stroke="#01E37F" strokeWidth="2"/>
          <path d="M140 20v70c-5 30-25 35-35 33H60c-35 0-50-65 5-70-2-45 55-55 75-33z" stroke="#8AED06" strokeWidth="2"/>
        </svg>
        <h2 style={{ font: "700 30px/1.2 var(--ih-font-display)", margin: 0, letterSpacing: "-.75px" }}>
          Bem-vindo de volta, {doctorName}
        </h2>
        <p style={{ font: "400 16px/1.5 var(--ih-font-body)", margin: "8px 0 24px", color: "rgba(255,255,255,.9)", maxWidth: 520 }}>
          {inProgress > 0
            ? `${inProgress} consulta${inProgress > 1 ? "s" : ""} sendo transcrita${inProgress > 1 ? "s" : ""} agora.`
            : "Pronto para iniciar uma nova consulta?"}
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <GlassChip label="TOTAL" value={`${consultations.length} consultas`} />
          <GlassChip label="TRANSCRITAS" value={`${transcribed} prontas`} />
          {user?.specialty && <GlassChip label="ESPECIALIDADE" value={user.specialty} />}
        </div>
      </div>

      {/* Onboarding — aparece apenas no primeiro acesso, enquanto CRM estiver vazio */}
      {showOnboarding && (
        <OnboardingCard onComplete={handleCompleteOnboarding} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpis.map((k, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: k.green ? "rgba(46,204,113,.15)" : "#F1F5F2",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={k.icon} size={18} color={k.green ? "#2ECC71" : "#3D4A3E"} />
              </div>
              {k.green && <Pill tone="green"><LiveDot />LIVE</Pill>}
            </div>
            <div style={{ font: "500 13px/1.2 var(--ih-font-body)", color: "#6B7280", marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: "700 24px/1.1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.3px" }}>{k.value}</div>
            <div style={{ font: "500 12px/1.2 var(--ih-font-body)", color: k.green ? "#2ECC71" : "#6B7280", marginTop: 6 }}>{k.hint}</div>
          </Card>
        ))}
      </div>

      {/* Lista de consultas */}
      <Card padding={0}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #EAEDED" }}>
          <div>
            <h3 style={{ font: "700 18px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>Histórico de consultas</h3>
            <p style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", margin: "2px 0 0" }}>
              {todayLabel}
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => !showOnboarding && router.push("/dashboard/nova-consulta")}
              style={{
                opacity: showOnboarding ? 0.45 : 1,
                cursor: showOnboarding ? "not-allowed" : "pointer",
              }}
            >
              <Icon name="plus" size={14} color="#fff" />
              Nova consulta
            </Button>
            {showOnboarding && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#1A1C1B", color: "#fff",
                font: "400 12px/1.4 var(--ih-font-body)",
                padding: "8px 12px", borderRadius: 8,
                whiteSpace: "nowrap", pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,.2)",
                zIndex: 10,
              }}>
                Complete seu perfil para iniciar consultas.
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#6B7280", font: "400 14px/1.5 var(--ih-font-body)" }}>
            Carregando consultas…
          </div>
        )}

        {!loading && consultations.length === 0 && (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Icon name="mic" size={32} color="#CBD5E1" />
            <p style={{ font: "500 15px/1.5 var(--ih-font-body)", color: "#94A3B8", marginTop: 12 }}>
              Nenhuma consulta registrada ainda.
            </p>
            <Button variant="primary" size="sm" style={{ marginTop: 12 }} onClick={() => router.push("/dashboard/nova-consulta")}>
              Iniciar primeira consulta
            </Button>
          </div>
        )}

        {!loading && recent.map((c, i) => {
          const st = STATUS_MAP[c.status] ?? { label: c.status, tone: "slate" as const };
          const isClickable = c.status === "TRANSCRIBED";
          return (
            <div
              key={c.id}
              onClick={() => isClickable && router.push(`/dashboard/consulta/${c.id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 20,
                padding: "16px 24px",
                borderBottom: i === recent.length - 1 ? "none" : "1px solid #F1F5F2",
                cursor: isClickable ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar initials={initials(c.patient_name)} size={40} color={i % 2 ? "#26A69A" : "#2ECC71"} />
                <div>
                  <div style={{ font: "700 14px/1.2 var(--ih-font-body)", color: "#191C1D" }}>
                    {c.patient_name || "Paciente não informado"}
                  </div>
                  <div style={{ font: "400 12px/1.2 var(--ih-font-body)", color: "#6B7280", marginTop: 3 }}>
                    {fmtDate(c.created_at)}
                  </div>
                </div>
              </div>
              <Pill tone={st.tone}>
                {(c.status === "PENDING" || c.status === "PROCESSING") && <LiveDot />}
                {st.label}
              </Pill>
              {isClickable && <Icon name="chevronRight" size={18} color="#94A3B8" />}
            </div>
          );
        })}

        {/* Rodapé — botão "Ver histórico completo" */}
        {!loading && consultations.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderTop: "1px solid #EAEDED",
          }}>
            <span style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280" }}>
              {consultations.length > 5
                ? `Exibindo 5 de ${consultations.length} consultas`
                : `${consultations.length} consulta${consultations.length > 1 ? "s" : ""} no total`}
            </span>
            <button
              disabled
              title="Em breve"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                color: "#9CA3AF",
                font: "500 13px/1 var(--ih-font-body)",
                cursor: "not-allowed",
                opacity: 0.7,
              }}
            >
              Ver histórico completo
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#EAEDED",
                color: "#6B7280",
                letterSpacing: ".3px",
              }}>
                EM BREVE
              </span>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function GlassChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.15)",
      border: "1px solid rgba(255,255,255,.2)",
      backdropFilter: "blur(12px)",
      borderRadius: 12,
      padding: "10px 16px",
      whiteSpace: "nowrap",
    }}>
      <div style={{ font: "700 10px/1 var(--ih-font-display)", opacity: .8, letterSpacing: ".5px", marginBottom: 6 }}>{label}</div>
      <div style={{ font: "700 15px/1.2 var(--ih-font-display)" }}>{value}</div>
    </div>
  );
}
