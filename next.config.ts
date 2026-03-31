import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Optimización para Docker (CRÍTICO: genera el bundle standalone)
  output: "standalone",

  // 2. Security Headers HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevención de clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevención de MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control de Referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restricciones de APIs del navegador
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval necesario para Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // 4. Proxy hacia Odoo (las API Routes internas lo manejan, no se necesita rewrite público)
  reactStrictMode: true,
};

export default nextConfig;
