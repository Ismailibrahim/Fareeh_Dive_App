import type { NextConfig } from "next";

// The backend API URL - Next.js will proxy all /api and /sanctum requests to it.
// This means the browser only ever talks to port 3000, eliminating all
// cross-origin CORS and CSRF cookie issues regardless of network IP.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this app folder as root
  turbopack: {
    root: __dirname,
  },
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  /**
   * Reverse proxy rewrites.
   *
   * All /api/*, /sanctum/*, and /storage/* requests from the browser are
   * forwarded server-side to the Laravel backend. The browser never makes a
   * direct cross-origin request to :8000, so:
   *   - No CORS preflight failures
   *   - No CSRF cookie domain mismatch
   *   - Works from any device/IP on the network with zero config changes
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/sanctum/:path*',
        destination: `${API_URL}/sanctum/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${API_URL}/storage/:path*`,
      },
    ];
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/storage/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
