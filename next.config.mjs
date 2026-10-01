/** @type {import('next').NextConfig} */
const isGitHubActions = process.env.GITHUB_ACTIONS || false;
const repoName = 'Academia-Nexora';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubActions ? `/${repoName}` : '',
  assetPrefix: isGitHubActions ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
