"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import Icon from "@/components/ui/Icon";
import type { ExamPriority, ExamSuggestion } from "@/lib/types";

const PRIORITY_BORDER: Record<ExamPriority, string> = {
  alta: "#EF4444",
  media: "#F59E0B",
  baixa: "#3B82F6",
};

const PRIORITY_PILL: Record<ExamPriority, "red" | "yellow" | "slate"> = {
  alta: "red",
  media: "yellow",
  baixa: "slate",
};

const PRIORITY_LABEL: Record<ExamPriority, string> = {
  alta: "Prioridade alta",
  media: "Prioridade média",
  baixa: "Prioridade baixa",
};

interface ExamSuggestionCardProps {
  suggestion: ExamSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (name: string) => void;
  onUndo: () => void;
  loading: boolean;
}

export default function ExamSuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onEdit,
  onUndo,
  loading,
}: ExamSuggestionCardProps) {
  const { exam_name, category, priority, justification, hypothesis_ref, status, is_manual } = suggestion;

  const isAccepted = status === "aceito";
  const isRejected = status === "rejeitado";
  const actionable = !isAccepted && !isRejected;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(exam_name);

  function commitEdit() {
    const trimmed = name.trim();
    setEditing(false);
    if (trimmed && trimmed !== exam_name) onEdit(trimmed);
    else setName(exam_name);
  }

  return (
    <div
      style={{
        background: isAccepted ? "#F0FDF4" : "#fff",
        border: "1px solid rgba(187,203,187,0.18)",
        borderLeft: `4px solid ${PRIORITY_BORDER[priority]}`,
        borderRadius: 14,
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        padding: 18,
        opacity: isRejected ? 0.5 : 1,
        transition: "opacity .2s, background .2s",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          {isAccepted && <Icon name="check" size={16} color="#1D7A44" />}
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setName(exam_name);
                  setEditing(false);
                }
              }}
              style={{
                flex: 1,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "6px 10px",
                font: "700 15px var(--ih-font-body)",
                color: "#191C1D",
                outline: "none",
              }}
            />
          ) : (
            <span style={{ font: "700 15px/1.3 var(--ih-font-body)", color: "#191C1D" }}>{exam_name}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill tone="slate">{category}</Pill>
          <Pill tone={PRIORITY_PILL[priority]}>{PRIORITY_LABEL[priority]}</Pill>
          {is_manual && <Pill tone="ghost">Manual</Pill>}
        </div>
      </div>

      {/* Body */}
      <p style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#475569", margin: 0 }}>{justification}</p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ font: "400 12px var(--ih-font-body)", color: "#94A3B8" }}>
          Hipótese: <strong style={{ color: "#64748B", fontWeight: 600 }}>{hypothesis_ref}</strong>
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          {loading ? (
            <span style={{ font: "400 12px var(--ih-font-body)", color: "#94A3B8" }}>Salvando…</span>
          ) : isRejected ? (
            <Button variant="ghost" size="sm" onClick={onUndo}>
              Desfazer
            </Button>
          ) : isAccepted ? (
            <Pill tone="green">
              <Icon name="check" size={12} color="#1D7A44" />
              Aceito
            </Pill>
          ) : (
            actionable && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={onReject}>
                  Rejeitar
                </Button>
                <Button variant="primary" size="sm" onClick={onAccept}>
                  Aceitar
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
