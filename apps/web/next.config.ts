import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
