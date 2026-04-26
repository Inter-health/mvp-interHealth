interface Props {
  line: string;
}

export default function SpeakerBubble({ line }: Props) {
  const isDoc = line.startsWith("[MÉDICO]");
  const isPat = line.startsWith("[PACIENTE]");
  const labelMatch = line.match(/^\[([^\]]+)\]:\s*/);
  const label = labelMatch ? labelMatch[1] : null;
  const text  = labelMatch ? line.slice(labelMatch[0].length) : line;

  const align      = isPat ? "flex-end" : "flex-start";
  const bg         = isDoc ? "#EAFAF1" : isPat ? "#F0F2F5" : "#FAFAFA";
  const border     = isDoc ? "1px solid rgba(46,204,113,.25)" : "1px solid #E2E5E9";
  const avatarBg   = isDoc ? "#2ECC71" : isPat ? "#94A3B8" : "#CBD5E1";
  const avatarInitial = isDoc ? "M" : isPat ? "P" : (label?.[0] ?? "?");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: isPat ? "row-reverse" : "row" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: avatarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "700 11px/1 var(--ih-font-body)", color: "#fff", flexShrink: 0,
        }}>
          {avatarInitial}
        </div>
        <span style={{
          font: "700 10px/1 var(--ih-font-body)",
          color: isDoc ? "#006d37" : "#555",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}>
          {label ?? "Locutor"}
        </span>
      </div>
      <div style={{
        maxWidth: "75%", padding: "10px 14px",
        borderRadius: isPat ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: bg, border,
      }}>
        <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#1E2A1F", margin: 0 }}>
          {text}
        </p>
      </div>
    </div>
  );
}
