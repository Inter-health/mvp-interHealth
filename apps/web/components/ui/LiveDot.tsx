interface LiveDotProps {
  color?: string;
}

export default function LiveDot({ color = "#2ECC71" }: LiveDotProps) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 0 3px ${color}40`,
        animation: "ih-pulse 1.6s infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
