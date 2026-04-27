import { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, padding = 24, style, className, onClick }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid rgba(187,203,187,0.1)",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,.05)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
