import { CSSProperties, ReactNode } from "react";

type Tone = "green" | "greenSoft" | "slate" | "danger" | "ghost" | "dark";

const tones: Record<Tone, CSSProperties> = {
  green:     { background: "#E9F9F0", color: "#1D7A44" },
  greenSoft: { background: "rgba(46,204,113,.15)", color: "#1D8348" },
  slate:     { background: "#F3F4F5", color: "#3D4A3E" },
  danger:    { background: "#FEF2F2", color: "#E74C3C" },
  ghost:     { background: "transparent", border: "1px solid #E7E8E9", color: "#3D4A3E" },
  dark:      { background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", backdropFilter: "blur(12px)" },
};

interface PillProps {
  tone?: Tone;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Pill({ tone = "green", children, style }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 9999,
        fontFamily: "var(--ih-font-body)",
        fontWeight: 700,
        fontSize: 12,
        lineHeight: "1.4",
        letterSpacing: ".3px",
        whiteSpace: "nowrap",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
