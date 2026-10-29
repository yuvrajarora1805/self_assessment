import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare domain and local origins
  allowedDevOrigins: [
    'self.yarora.dev',
    'dealer.yarora.dev',
    'portal.yarora.dev',
    '*.yarora.dev',
    '*.trycloudflare.com',
    '192.168.18.20',
    '192.168.18.20:3000',
    '192.168.18.20:3001',
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1:3000',
    '127.0.0.1:3001'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
