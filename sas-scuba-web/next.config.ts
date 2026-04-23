import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Turbopack uses this app folder as root (prevents it from selecting
  // an unrelated parent directory when multiple lockfiles exist).
  turbopack: {
    root: __dirname,
  },
  reactCompiler: true,
  // TypeScript checking enabled for code review
  typescript: {
    // Enable type checking to find all errors
    ignoreBuildErrors: false,
  },
  // Speed up builds
  productionBrowserSourceMaps: false,
  // Optimize compilation
  compiler: {
    // Remove console.log in production (keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    // Use faster compiler - optimize package imports
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
    // Optimize images
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Standalone output for better deployment (optional)
  // output: 'standalone',
};

export default nextConfig;
