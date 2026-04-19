"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";

const appointments = [
  { time: "09:30", name: "Robert Chen",     type: "Retorno · Cardiologia",  status: "in-clinic" as const, initials: "RC" },
  { time: "10:15", name: "Marina Oliveira", type: "Primeira consulta",       status: "confirmed" as const, initials: "MO" },
  { time: "11:00", name: "Carlos Silva",    type: "Acompanhamento",          status: "confirmed" as const, initials: "CS" },
  { time: "14:30", name: "Ana Santos",      type: "Teleconsulta",            status: "remote" as const,    initials: "AS" },
  { time: "16:00", name: "João Ferreira",   type: "Retorno",                 status: "confirmed" as const, initials: "JF" },
];

const statusMap = {
  "in-clinic": { label: "Na clínica",  tone: "green" as const },
  confirmed:   { label: "Confirmado",  tone: "slate" as const },
  remote:      { label: "Teleconsulta",tone: "greenSoft" as const },
};

const kpis = [
  { icon: "mic" as const,      label: "Consulta ativa",       value: "Gravando", hint: "00:14:22",           green: true  },
  { icon: "users" as const,    label: "Pacientes atendidos",  value: "128",      hint: "+12% este mês",      green: false },
  { icon: "activity" as const, label: "Prontuários gerados",  value: "94",       hint: "por IA esta semana", green: false },
  { icon: "clock" as const,    label: "Tempo médio",          value: "18 min",   hint: "por consulta",       green: false },
];

export default function DashboardPage() {
  const router = useRouter();

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
          Bem-vindo de volta, Dr. Médico.
        </h2>
        <p style={{ font: "400 16px/1.5 var(--ih-font-body)", margin: "8px 0 24px", color: "rgba(255,255,255,.9)", maxWidth: 520 }}>
          Você tem 8 consultas agendadas para hoje. 3 pacientes já chegaram à clínica.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <GlassChip label="PRÓXIMO PACIENTE" value="Robert Chen · 09:30"/>
          <GlassChip label="HOJE" value="8 consultas"/>
          <GlassChip label="PENDÊNCIAS" value="3 prontuários"/>
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
                <Icon name={k.icon} size={18} color={k.green ? "#2ECC71" : "#3D4A3E"}/>
              </div>
              {k.green && <Pill tone="green"><LiveDot/>LIVE</Pill>}
            </div>
            <div style={{ font: "500 13px/1.2 var(--ih-font-body)", color: "#6B7280", marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: "700 24px/1.1 var(--ih-font-display)", color: "#191C1D", letterSpacing: "-.3px" }}>{k.value}</div>
            <div style={{ font: "500 12px/1.2 var(--ih-font-body)", color: k.green ? "#2ECC71" : "#6B7280", marginTop: 6 }}>{k.hint}</div>
          </Card>
        ))}
      </div>

      {/* Schedule */}
      <Card padding={0}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #EAEDED" }}>
          <div>
            <h3 style={{ font: "700 18px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>Agenda de hoje</h3>
            <p style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/nova-consulta")}>
            <Icon name="plus" size={14} color="#fff"/>
            Nova consulta
          </Button>
        </div>
        {appointments.map((a, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr auto auto",
            alignItems: "center",
            gap: 20,
            padding: "16px 24px",
            borderBottom: i === appointments.length - 1 ? "none" : "1px solid #F1F5F2",
          }}>
            <div style={{ font: "700 16px/1 var(--ih-font-display)", color: "#191C1D" }}>{a.time}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar initials={a.initials} size={40} color={i % 2 ? "#26A69A" : "#2ECC71"}/>
              <div>
                <div style={{ font: "700 14px/1.2 var(--ih-font-body)", color: "#191C1D" }}>{a.name}</div>
                <div style={{ font: "400 12px/1.2 var(--ih-font-body)", color: "#6B7280", marginTop: 3 }}>{a.type}</div>
              </div>
            </div>
            <Pill tone={statusMap[a.status].tone}>
              {a.status === "in-clinic" && <LiveDot/>}
              {statusMap[a.status].label}
            </Pill>
            <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8 }}>
              <Icon name="chevronRight" size={18} color="#94A3B8"/>
            </button>
          </div>
        ))}
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
