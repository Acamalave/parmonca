import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfjljpllrgqbrpzsotov.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "wbsaefkvvkktkgnwhtov.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "app.grupobuco.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
