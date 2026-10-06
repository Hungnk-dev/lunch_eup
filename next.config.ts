import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cho phép upload ảnh QR (tối đa 5MB) qua server action
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
