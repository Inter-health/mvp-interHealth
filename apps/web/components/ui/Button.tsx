import { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "gradient" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, CSSProperties> = {
  sm: { height: 36, padding: "0 16px", fontSize: 13, borderRadius: 12 },
  md: { height: 44, padding: "0 24px", fontSize: 14, borderRadius: 16 },
  lg: { height: 60, padding: "0 32px", fontSize: 18, borderRadius: 16 },
};

const variants: Record<Variant, CSSProperties> = {
  primary:  { background: "#2ECC71", color: "#fff", boxShadow: "0 4px 14px rgba(46,204,113,.3)" },
  gradient: { background: "linear-gradient(135deg,#2ECC71 0%,#26A69A 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(46,204,113,.3)" },
  secondary:{ background: "#F8F9FA", color: "#191C1D" },
  ghost:    { background: "transparent", color: "#2ECC71" },
  danger:   { background: "#FEF2F2", color: "#E74C3C" },
  dark:     { background: "#191C1D", color: "#fff" },
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function Button({ variant = "primary", size = "md", children, onClick, style, disabled, type = "button" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--ih-font-body)",
        fontWeight: 700,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
