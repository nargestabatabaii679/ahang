/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pipeline jobs can take a while; allow large uploads for photo/voice.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
