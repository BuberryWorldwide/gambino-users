/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default fallback for unlisted directives
              "default-src 'self'",

              // Scripts: self + inline (required for Next.js) + eval (for wallet adapters)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://vercel.live https://*.vercel-analytics.com https://*.vercel-insights.com",

              // Styles: self + inline (required for Tailwind CSS)
              "style-src 'self' 'unsafe-inline'",

              // Images: self + data URIs (for QR codes) + blob (for wallet icons) + HTTPS
              "img-src 'self' data: blob: https:",

              // Fonts: self only (no external fonts detected)
              "font-src 'self' data:",

              // API connections: backend + Solana RPC endpoints + analytics
              "connect-src 'self' " + [
                "https://api.gambino.gold",
                "http://localhost:3001",
                "https://api.mainnet-beta.solana.com",
                "https://api.metaplex.solana.com",
                // Phantom wallet connections
                "https://phantom.app",
                "wss://phantom.app",
                // MetaMask wallet connections
                "https://metamask.io",
                // Cloudflare & Vercel analytics
                "https://cloudflareinsights.com",
                "https://*.vercel-insights.com",
              ].join(' '),

              // Frames: wallet providers + legal pages
              "frame-src 'self' " + [
                "https://phantom.app",
                "https://gambino.gold",
                "https://admin.gambino.gold",
              ].join(' '),

              // Form submissions
              "form-action 'self' https://api.gambino.gold",

              // Base URI restriction
              "base-uri 'self'",

              // Block plugins/embeds
              "object-src 'none'",

              // Web manifest
              "manifest-src 'self'",

              // Workers (for wallet adapters if needed)
              "worker-src 'self' blob:",

              // Child contexts
              "child-src 'self' blob:",

              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
