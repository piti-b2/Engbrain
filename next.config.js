/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['btcmdvroyqwtucrqmuwl.supabase.co', 'xsgames.co', 'i.pinimg.com', 'placehold.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), speech-synthesis=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' *.clerk.accounts.dev *.supabase.co api.dictionaryapi.dev api.voicerss.org wordsapiv1.p.rapidapi.com; worker-src 'self' blob:; media-src 'self' https: blob:; manifest-src 'self'"
          }
        ]
      }
    ];
  },
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  swcMinify: true,
  logging: {
    level: 'error'
  }
}

process.env.NEXT_TELEMETRY_DISABLED = '1'

module.exports = nextConfig
