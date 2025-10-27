/** @type {import('next').NextConfig} */
const isCI = process.env.CI === 'true';

// GitHub Pages requires static export
// We set basePath if repository is not a user/organization site
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // If deploying to https://<user>.github.io/chainFilm
  // basePath must be '/chainFilm'
  basePath: process.env.NEXT_BASE_PATH || '/chainFilm',
};

module.exports = nextConfig;


