import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/VIPER" : undefined,
  assetPrefix: isGitHubPages ? "/VIPER" : undefined,
  images: {
    unoptimized: isGitHubPages,
  },
  trailingSlash: isGitHubPages,
};

export default nextConfig;
