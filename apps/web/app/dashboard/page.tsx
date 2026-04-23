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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef   = useRef(false); // guard contra fetchData concorrente

  async function fetchData() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [userRes, consultRes] = await Promise.all([
        apiFetch("/users/me"),
        apiFetch("/consultations"),
      ]);
      if (userRes.ok) setUser(await userRes.json());
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
  }, []);

  // Polling enquanto houver consultas em andamento
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
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [consultations]);

  const transcribed = consultations.filter((c) => c.status === "TRANSCRIBED").length;
  const inProgress  = consultations.filter((c) => c.status === "PENDING" || c.status === "PROCESSING").length;

  const kpis = [
    { icon: "mic" as const,      label: "Em andamento",        value: String(inProgress),   hint: "aguardando transcrição", green: inProgress > 0 },
    { icon: "users" as const,    label: "Total de consultas",  value: String(consultations.length), hint: "registradas", green: false },
    { icon: "activity" as const, label: "Transcritas",         value: String(transcribed),  hint: "prontas para revisão",   green: false },
    { icon: "clock" as const,    label: "Hoje",                value: String(consultations.filter((c) => new Date(c.created_at).toDateString() === new Date().toDateString()).length), hint: "consultas hoje", green: false },
  ];

  const doctorName = user ? `Dr${user.name.includes("Dra") ? "a" : "."} ${user.name.replace(/^Dr[a.]?\s*/i, "")}` : "...";

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
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/nova-consulta")}>
            <Icon name="plus" size={14} color="#fff" />
            Nova consulta
          </Button>
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

        {!loading && consultations.map((c, i) => {
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
                borderBottom: i === consultations.length - 1 ? "none" : "1px solid #F1F5F2",
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
