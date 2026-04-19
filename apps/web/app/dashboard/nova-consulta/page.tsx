"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";

const transcript = [
  { who: "doctor",  name: "Dr. Médico",   text: "Bom dia, Sr. Chen. Como o senhor está se sentindo hoje?",                                              time: "09:32:14" },
  { who: "patient", name: "Robert Chen",  text: "Bom dia, doutor. Melhor, mas ainda sinto um desconforto no peito quando subo escadas.",                time: "09:32:28" },
  { who: "doctor",  name: "Dr. Médico",   text: "Entendo. E a pressão, o senhor tem verificado como combinamos?",                                       time: "09:32:46" },
  { who: "patient", name: "Robert Chen",  text: "Sim, tenho medido toda manhã. Geralmente fica em 135 por 85.",                                         time: "09:33:02" },
  { who: "doctor",  name: "Dr. Médico",   text: "Isso está melhor que o último retorno. Vamos ajustar a medicação e fazer um novo eletrocardiograma.",  time: "09:33:20" },
];

const insights = [
  { icon: "heart" as const,     title: "Achado clínico",   body: "Desconforto retroesternal ao esforço físico. Considere ECG + troponina." },
  { icon: "activity" as const,  title: "Padrão detectado", body: "PA sistólica média 135/85 — melhora em relação à última consulta (148/92)." },
  { icon: "sparkles" as const,  title: "Sugestão clínica", body: "Aderência medicamentosa parece boa. Reforçar exercício leve." },
];

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

export default function NovaConsultaPage() {
  const [recording, setRecording] = useState(true);
  const [elapsed, setElapsed] = useState(842);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  return (
    <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
      {/* Main column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Patient + recorder header */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Avatar initials="RC" size={56} color="#26A69A"/>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ font: "700 18px/1.2 var(--ih-font-display)", color: "#191C1D" }}>Robert Chen</div>
              <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", marginTop: 4 }}>
                67 anos · Cardiologia · Retorno
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
              {recording && (
                <Pill tone="green"><LiveDot/>GRAVANDO</Pill>
              )}
              <span style={{ fontFamily: "var(--ih-font-mono)", fontWeight: 700, fontSize: 18, color: "#191C1D", letterSpacing: "1px" }}>
                {fmt(elapsed)}
              </span>
              <Button
                variant={recording ? "danger" : "primary"}
                size="sm"
                onClick={() => setRecording(r => !r)}
              >
                <Icon name={recording ? "pause" : "mic"} size={14} color={recording ? "#E74C3C" : "#fff"}/>
                {recording ? "Pausar" : "Retomar"}
              </Button>
              <Button variant="dark" size="sm">
                <Icon name="check" size={14} color="#fff"/>
                Finalizar
              </Button>
            </div>
          </div>
        </Card>

        {/* Transcript */}
        <Card padding={0}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #EAEDED", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ font: "700 18px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>Transcrição ao vivo</h3>
              <p style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", margin: "3px 0 0" }}>
                Transcrita pela IA · pt-BR · diarização automática
              </p>
            </div>
            <Button variant="ghost" size="sm">Exportar</Button>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: 420, overflowY: "auto" }}>
            {transcript.map((line, i) => {
              const isDoc = line.who === "doctor";
              return (
                <div key={i} style={{ display: "flex", gap: 12, flexDirection: isDoc ? "row" : "row-reverse" }}>
                  <Avatar initials={isDoc ? "DM" : "RC"} size={32} color={isDoc ? "#2ECC71" : "#26A69A"}/>
                  <div style={{ maxWidth: "75%" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexDirection: isDoc ? "row" : "row-reverse" }}>
                      <span style={{ font: "700 13px/1 var(--ih-font-body)", color: "#191C1D" }}>{line.name}</span>
                      <span style={{ fontFamily: "var(--ih-font-mono)", fontWeight: 500, fontSize: 11, color: "#94A3B8" }}>{line.time}</span>
                    </div>
                    <div style={{
                      background: isDoc ? "#EAFAF1" : "#F3F4F5",
                      border: isDoc ? "1px solid rgba(46,204,113,.2)" : "1px solid #E7E8E9",
                      borderRadius: 14,
                      padding: "12px 16px",
                      font: "400 14px/1.6 var(--ih-font-body)",
                      color: "#3D4A3E",
                    }}>
                      {line.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {recording && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 44px", color: "#6B7280", font: "500 12px/1 var(--ih-font-body)" }}>
                <LiveDot color="#26A69A"/>
                <span>Ouvindo…</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Side column — AI insights */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Icon name="sparkles" size={18} color="#2ECC71"/>
            <span style={{ font: "700 11px/1 var(--ih-font-body)", letterSpacing: "1.2px", color: "#3D4A3E", textTransform: "uppercase" }}>
              Agente Clínico IA
            </span>
          </div>
          <h3 style={{ font: "700 20px/1.3 var(--ih-font-display)", color: "#191C1D", margin: "6px 0 16px" }}>
            Insights da consulta
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 12, background: "#FBFCFC", border: "1px solid rgba(187,203,187,.2)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(46,204,113,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={ins.icon} size={16} color="#2ECC71"/>
                </div>
                <div>
                  <div style={{ font: "700 13px/1.3 var(--ih-font-body)", color: "#191C1D", marginBottom: 3 }}>{ins.title}</div>
                  <div style={{ font: "400 12px/1.5 var(--ih-font-body)", color: "#3D4A3E" }}>{ins.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ font: "700 14px/1.3 var(--ih-font-display)", color: "#191C1D", margin: "0 0 12px" }}>
            Prontuário — rascunho
          </h3>
          <div style={{ font: "400 12px/1.6 var(--ih-font-body)", color: "#3D4A3E", padding: 14, background: "#F8F9FA", borderRadius: 10, whiteSpace: "pre-line" }}>
            {`• Retorno — 6 meses pós-ajuste de losartana\n• Queixa: desconforto retroesternal ao esforço\n• PA média: 135 × 85 mmHg\n• Plano: ECG + troponina; revisar em 4 semanas`}
          </div>
          <Button variant="primary" size="sm" style={{ marginTop: 12, width: "100%" }}>
            Revisar & salvar no EHR
          </Button>
        </Card>
      </div>
    </div>
  );
}
