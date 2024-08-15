import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    ppr: "incremental",
    optimizePackageImports: ["@mynaui/icons-react"],
  },
  async redirects() {
    return [
      {
        source: "/use",
        destination: "https://get.mosaicimg.com/image/get_image",
        permanent: false,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
