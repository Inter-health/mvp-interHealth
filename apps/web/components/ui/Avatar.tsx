interface AvatarProps {
  initials?: string;
  size?: number;
  color?: string;
}

export default function Avatar({ initials = "?", size = 40, color = "#2ECC71" }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${color} 0%, #26A69A 100%)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--ih-font-display)",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}
