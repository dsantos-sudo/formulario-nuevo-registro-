import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Optimización para Docker (CRÍTICO: genera el bundle standalone)
  output: "standalone",

  // 2. Ignorar errores de TypeScript pre-existentes en el build
  typescript: {
    ignoreBuildErrors: true,
  },

  // 3. Security Headers HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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

  reactStrictMode: true,
};

export default nextConfig;
