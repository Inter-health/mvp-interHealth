"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SpeakerBubble from "@/components/ui/SpeakerBubble";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import LiveDot from "@/components/ui/LiveDot";
import { apiFetch } from "@/lib/api";
import type { ConsultationDetail } from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_MAP: Record<string, { label: string; tone: "green" | "slate" | "greenSoft" | "red" | "yellow" }> = {
  PENDING:     { label: "Aguardando",    tone: "slate" },
  PROCESSING:  { label: "Transcrevendo", tone: "yellow" },
  TRANSCRIBED: { label: "Pronta",         tone: "green" },
  ERROR:       { label: "Erro",           tone: "red" },
};

export default function ConsultaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStatus() {
    try {
      const res = await apiFetch(`/consultations/${id}/status`);
      if (!res.ok) return;
      const d: ConsultationDetail = await res.json();
      setData(d);
      setLoading(false);
      if (d.status === "TRANSCRIBED" || d.status === "ERROR") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch {
      // apiFetch redireciona para /login em 401
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  const st = data ? (STATUS_MAP[data.status] ?? { label: data.status, tone: "slate" as const }) : null;
  const lines = data?.transcript ? data.transcript.split("\n").filter(Boolean) : [];
  const isInProgress = data?.status === "PENDING" || data?.status === "PROCESSING";

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Voltar
        </Button>
        <h2 style={{ font: "700 22px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0, flex: 1 }}>
          Detalhes da consulta
        </h2>
        {!loading && data && (
          <Button
            variant="primary"
            size="sm"
            disabled
            style={{ opacity: 0.5 }}
          >
            <Icon name="sparkles" size={14} color="#fff" />
            Gerar SOAP
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", font: "400 14px var(--ih-font-body)" }}>
          Carregando consulta…
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Meta info card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ font: "700 20px/1.2 var(--ih-font-display)", color: "#191C1D", marginBottom: 4 }}>
                  {data.patient_name || "Paciente não informado"}
                </div>
                <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280" }}>
                  {fmtDate(data.created_at)}
                </div>
              </div>
              {st && (
                <Pill tone={st.tone}>
                  {isInProgress && <LiveDot />}
                  {st.label}
                </Pill>
              )}
            </div>
          </Card>

          {/* Transcribed — show chat bubbles */}
          {data.status === "TRANSCRIBED" && (
            <Card padding={0}>
              <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid #EAEDED",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <h3 style={{ font: "700 16px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
                    Transcrição da consulta
                  </h3>
                  <p style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#94A3B8", margin: "4px 0 0" }}>
                    Identificação automática de locutores · AssemblyAI
                  </p>
                </div>
                <Pill tone="green">diarizado</Pill>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {lines.length > 0 ? (
                  lines.map((line, i) => <SpeakerBubble key={i} line={line} />)
                ) : (
                  <p style={{ font: "400 14px var(--ih-font-body)", color: "#94A3B8", textAlign: "center", margin: 0 }}>
                    Transcrição vazia.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Still processing */}
          {isInProgress && (
            <Card>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "rgba(46,204,113,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="activity" size={22} color="#2ECC71" />
                </div>
                <div>
                  <div style={{ font: "700 15px/1.2 var(--ih-font-body)", color: "#191C1D", marginBottom: 4 }}>
                    Transcrição em andamento
                  </div>
                  <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                    O áudio está sendo processado. Esta página atualiza automaticamente a cada 5 segundos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error */}
          {data.status === "ERROR" && (
            <Card>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "rgba(231,76,60,.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="activity" size={22} color="#E74C3C" />
                </div>
                <div>
                  <div style={{ font: "700 15px/1.2 var(--ih-font-body)", color: "#191C1D", marginBottom: 4 }}>
                    Erro na transcrição
                  </div>
                  <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                    {data.error_msg || "Ocorreu um erro inesperado ao processar o áudio."}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
