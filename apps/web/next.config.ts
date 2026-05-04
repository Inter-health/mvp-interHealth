import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Microfone permitido apenas na origem própria (gravação de consultas)
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js exige unsafe-inline para estilos injetados em runtime
      "style-src 'self' 'unsafe-inline'",
      // Next.js exige unsafe-eval no modo dev; em prod apenas inline é necessário
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // Permite chamadas à API (localhost em dev, Render em prod)
      `connect-src 'self' ${API_URL}`,
      // Blob URLs para gravação de áudio via MediaRecorder
      "media-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/solu%C3%A7%C3%A3o",
        destination: "/solucao",
      },
      {
        source: "/solução",
        destination: "/solucao",
      },
    ];
  },
};

export default nextConfig;
