import { CSSProperties } from "react";

type DisclaimerType = "soap" | "exames";

const TEXTS: Record<DisclaimerType, string> = {
  soap:
    "Revise o prontuário antes de confirmar. O conteúdo é gerado por IA a partir da " +
    "transcrição e pode conter imprecisões. O médico é o responsável pela exatidão do " +
    "documento clínico.",
  exames:
    "Sugestões de exames geradas por IA com caráter assistivo. Não constituem solicitação " +
    "nem prescrição. A decisão clínica e a responsabilidade são exclusivamente do médico.",
};

interface ClinicalDisclaimerProps {
  type: DisclaimerType;
  style?: CSSProperties;
}

export default function ClinicalDisclaimer({ type, style }: ClinicalDisclaimerProps) {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "#FEF9C3",
        border: "1px solid #FDE68A",
        color: "#92400E",
        borderRadius: 12,
        padding: "12px 16px",
        font: "400 13px/1.5 var(--ih-font-body)",
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 15, lineHeight: "1.4" }}>
        ⚠️
      </span>
      <span>{TEXTS[type]}</span>
    </div>
  );
}
