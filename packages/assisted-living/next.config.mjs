/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 1000,
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
