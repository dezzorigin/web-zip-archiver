import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export untuk Cloudflare Pages. Konsekuensinya: tidak ada API
  // route di build ini — /api/clone/* dilayani oleh worker/_worker.js
  // (lihat README & docs/ARCHITECTURE.md).
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
