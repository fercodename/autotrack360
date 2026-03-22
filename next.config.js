/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Los tipos de Supabase no estan autogenerados; ignorar en build por ahora
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warnings no deben romper el build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
