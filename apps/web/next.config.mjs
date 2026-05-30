/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
    images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.alayon.store",
      },
      {
        protocol: "https",
        hostname: "*.sharewin.pro",
      },
    ],
  },
  allowedDevOrigins: ['192.168.1.140', '192.168.1.120','localhost', '127.0.0.1', 'sharewin.pro', 'alayon.store'],
   async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-publishable-api-key' },
        ],
      },
    ];
  },
  experimental: {
    // Exclude API routes from static optimization
    outputFileTracingExcludes: {
      '*': ['./**/api/**/*'],
    },
  },
  typescript: {
        ignoreBuildErrors: true
  }
}

export default nextConfig
