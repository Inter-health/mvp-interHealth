"use client";

import { CSSProperties, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Icon from "@/components/ui/Icon";
import type { SOAPContent, SOAPStatus } from "@/lib/types";

type SectionKey = "subjetivo" | "objetivo" | "avaliacao" | "plano";

const SECTIONS: { key: SectionKey; label: string; letter: string; icon: string }[] = [
  { key: "subjetivo", label: "Subjetivo", letter: "S", icon: "users" },
  { key: "objetivo", label: "Objetivo", letter: "O", icon: "activity" },
  { key: "avaliacao", label: "Avaliação", letter: "A", icon: "stethoscope" },
  { key: "plano", label: "Plano", letter: "P", icon: "file" },
];

const GREEN = "#2ECC71";

interface SOAPViewerProps {
  soap: SOAPContent;
  soapStatus: SOAPStatus;
  onConfirm: (edits: Partial<SOAPContent>) => void;
  onReject: () => void;
  loading: boolean;
}

const labelStyle: CSSProperties = {
  font: "700 11px var(--ih-font-body)",
  letterSpacing: ".4px",
  textTransform: "uppercase",
  color: "#94A3B8",
  marginBottom: 6,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 72,
  resize: "vertical",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  padding: "10px 12px",
  font: "400 14px/1.6 var(--ih-font-body)",
  color: "#191C1D",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

export default function SOAPViewer({ soap, soapStatus, onConfirm, onReject, loading }: SOAPViewerProps) {
  const editable = soapStatus === "generated";
  const confirmed = soapStatus === "confirmed";

  const [draft, setDraft] = useState<SOAPContent>(soap);
  const [hipText, setHipText] = useState((soap.hipoteses_diagnosticas ?? []).join(", "));

  // Re-sincroniza quando um novo SOAP chega do backend (ex.: após gerar/recarregar).
  useEffect(() => {
    setDraft(soap);
    setHipText((soap.hipoteses_diagnosticas ?? []).join(", "));
  }, [soap]);

  function setField(key: SectionKey | "cid", value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleConfirm() {
    const hipoteses = hipText.split(",").map((s) => s.trim()).filter(Boolean);
    onConfirm({
      subjetivo: draft.subjetivo,
      objetivo: draft.objetivo,
      avaliacao: draft.avaliacao,
      plano: draft.plano,
      cid: draft.cid,
      hipoteses_diagnosticas: hipoteses,
    });
  }

  const hipoteses = editable
    ? hipText.split(",").map((s) => s.trim()).filter(Boolean)
    : draft.hipoteses_diagnosticas ?? [];

  return (
    <Card padding={0}>
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid #EAEDED",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="sparkles" size={18} color={GREEN} />
          <h3 style={{ font: "700 16px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
            Prontuário SOAP
          </h3>
        </div>
        {confirmed ? (
          <Pill tone="green">
            <Icon name="check" size={13} color="#1D7A44" />
            Prontuário confirmado
          </Pill>
        ) : (
          <Pill tone="yellow">Aguardando revisão</Pill>
        )}
      </div>

      {/* Seções SOAP */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {SECTIONS.map((s) => (
          <div key={s.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "rgba(46,204,113,.12)",
                  color: GREEN,
                  font: "700 13px var(--ih-font-display)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.letter}
              </span>
              <Icon name={s.icon as never} size={15} color="#64748B" />
              <span style={{ font: "700 14px var(--ih-font-body)", color: "#191C1D" }}>{s.label}</span>
            </div>
            {editable ? (
              <textarea
                value={draft[s.key]}
                onChange={(e) => setField(s.key, e.target.value)}
                style={textareaStyle}
                disabled={loading}
              />
            ) : (
              <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>
                {draft[s.key] || "—"}
              </p>
            )}
          </div>
        ))}

        {/* CID + Hipóteses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid #F1F5F9", paddingTop: 18 }}>
          <div>
            <div style={labelStyle}>CID-10</div>
            {editable ? (
              <input
                value={draft.cid ?? ""}
                onChange={(e) => setField("cid", e.target.value)}
                placeholder="Ex.: G43.1"
                disabled={loading}
                style={{ ...textareaStyle, minHeight: 0, height: 38, width: 160 }}
              />
            ) : (
              <Pill tone="slate">{draft.cid || "Não informado"}</Pill>
            )}
          </div>

          <div>
            <div style={labelStyle}>Hipóteses diagnósticas</div>
            {editable && (
              <input
                value={hipText}
                onChange={(e) => setHipText(e.target.value)}
                placeholder="Separe por vírgulas"
                disabled={loading}
                style={{ ...textareaStyle, minHeight: 0, height: 38, marginBottom: 10 }}
              />
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hipoteses.length > 0 ? (
                hipoteses.map((h, i) => (
                  <Pill key={i} tone="greenSoft">
                    {h}
                  </Pill>
                ))
              ) : (
                <span style={{ font: "400 13px var(--ih-font-body)", color: "#94A3B8" }}>Nenhuma hipótese registrada.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer de ações — só quando gerado (human-in-the-loop) */}
      {editable && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid #EAEDED", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ font: "400 12px/1.5 var(--ih-font-body)", color: "#92400E", margin: 0 }}>
            ⚠️ Revise o prontuário antes de confirmar. O médico é responsável pela precisão do documento clínico.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="primary" size="sm" onClick={handleConfirm} disabled={loading}>
              <Icon name="check" size={14} color="#fff" />
              {loading ? "Confirmando…" : "Confirmar prontuário"}
            </Button>
            <Button variant="secondary" size="sm" onClick={onReject} disabled={loading}>
              Rejeitar e gerar novamente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
