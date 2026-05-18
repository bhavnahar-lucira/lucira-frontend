/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  compress: true,
  images: {
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
  async rewrites() {
    return [
      {
        source: '/feeds/products.xml',
        destination: '/api/feeds/products',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap-proxy/sitemap.xml',
      },
      {
        source: '/sitemap_:slug.xml',
        destination: '/api/sitemap-proxy/sitemap_:slug.xml',
      },
      {
        source: '/api/proxy/earn-rewards/:path*',
        destination: 'https://api.lucirajewelry.com/earn-rewards/:path*',
      },
    ];
  },
};

export default nextConfig;
