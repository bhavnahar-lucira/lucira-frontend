import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  /* config options here */
  reactCompiler: true,
  compress: true,
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'luciraonline.myshopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lucirajewelry.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lucirajewelry.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.nector.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/cart',
        destination: '/checkout/cart',
        permanent: true,
      },
      {
        source: '/account/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/account/register',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/account',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/wishlist',
        destination: '/admin/wishlist',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/feeds/products.xml',
        destination: '/api/feeds/products',
      },
      {
        source: '/api/proxy/earn-rewards/:path*',
        destination: 'https://api.lucirajewelry.com/earn-rewards/:path*',
      },
      {
        source: '/cart.js',
        destination: '/cart.json', // Serve the JSON file to avoid IDE syntax errors in .js files
      },
      {
        source: '/cart.json',
        destination: '/cart.json', // Serve the static file in public/
      },
      {
        source: '/images/:path*',
        destination: '/images/:path*', // Ensure images don't hit dynamic routes if missing
      }
    ];
  },
};

export default nextConfig;
