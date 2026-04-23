"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";

const patients = [
  { initials: "RC", name: "Robert Chen",     age: 67, tag: "Cardiologia",        last: "Hoje · 09:30",    status: "in-clinic" as const, pending: 1, color: "#26A69A" },
  { initials: "MO", name: "Marina Oliveira", age: 34, tag: "Primeira consulta",  last: "Hoje · 10:15",    status: "confirmed" as const, pending: 0, color: "#2ECC71" },
  { initials: "CS", name: "Carlos Silva",    age: 52, tag: "Acompanhamento",     last: "12 abr · 14:00",  status: "done" as const,      pending: 0, color: "#26A69A" },
  { initials: "AS", name: "Ana Santos",      age: 41, tag: "Teleconsulta",       last: "10 abr · 16:30",  status: "done" as const,      pending: 2, color: "#2ECC71" },
  { initials: "JF", name: "João Ferreira",   age: 58, tag: "Hipertensão",        last: "05 abr · 11:00",  status: "done" as const,      pending: 0, color: "#26A69A" },
  { initials: "PL", name: "Paula Lima",      age: 29, tag: "Check-up",           last: "02 abr · 09:00",  status: "done" as const,      pending: 0, color: "#2ECC71" },
];

const statusMap = {
  "in-clinic": { label: "Na clínica", tone: "green" as const },
  confirmed:   { label: "Hoje",       tone: "greenSoft" as const },
  done:        { label: "Concluído",  tone: "slate" as const },
};

const filters = ["Todos", "Hoje", "Esta semana", "Pendentes"];

export default function PacientesPage() {
  const [filter, setFilter] = useState("Todos");

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ font: "700 24px/1.2 var(--ih-font-display)", color: "#191C1D", margin: "0 0 4px" }}>Pacientes</h1>
        <p style={{ font: "400 14px/1.4 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>Gerencie sua lista de pacientes</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: filter === f ? "#EAFAF1" : "#fff",
                border: filter === f ? "1px solid #2ECC71" : "1px solid #E7E8E9",
                color: filter === f ? "#1D8348" : "#3D4A3E",
                fontFamily: "var(--ih-font-body)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="primary" size="md">
          <Icon name="plus" size={14} color="#fff"/>
          Novo paciente
        </Button>
      </div>

      {/* Patient grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {patients.map((p, i) => (
          <Card
            key={i}
            padding={20}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <Avatar initials={p.initials} size={52} color={p.color}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{
                    font: "700 16px/1.2 var(--ih-font-display)",
                    color: "#191C1D",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {p.name}
                  </div>
                  <Pill tone={statusMap[p.status].tone}>
                    {p.status === "in-clinic" && <LiveDot/>}
                    {statusMap[p.status].label}
                  </Pill>
                </div>
                <div style={{
                  font: "400 13px/1.4 var(--ih-font-body)",
                  color: "#6B7280",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {p.age} anos · {p.tag}
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #F1F5F2",
                }}>
                  <div style={{ font: "500 12px/1.2 var(--ih-font-body)", color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="clock" size={12} color="#94A3B8"/>
                    {p.last}
                  </div>
                  {p.pending > 0 && (
                    <Pill tone="danger">
                      {p.pending} pendência{p.pending > 1 ? "s" : ""}
                    </Pill>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
