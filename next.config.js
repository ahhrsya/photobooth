/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",       // Static export — all pages are "use client", no SSR needed
  trailingSlash: true,    // /foo → /foo/index.html — required for Cloudflare Pages file routing
  images: {
    unoptimized: true,    // next/image optimization not available in static export
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

module.exports = nextConfig;
