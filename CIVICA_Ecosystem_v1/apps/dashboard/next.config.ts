import { loadEnvLocal } from '@civica/config';
import type { NextConfig } from 'next';

// Load the repo-root .env.local (this app's cwd is apps/dashboard, but secrets
// are kept in a single root .env.local shared with packages/db's scripts).
// Re-evaluated in each Next.js worker process since they re-import this config.
loadEnvLocal(__dirname);

const nextConfig: NextConfig = {
  // Self-contained build output (server + only the deps it actually needs) --
  // makes the Docker image far smaller than copying the whole node_modules tree.
  output: 'standalone',
  transpilePackages: [
    '@civica/auth',
    '@civica/db',
    '@civica/audit',
    '@civica/email',
    '@civica/permissions',
    '@civica/ui',
    '@civica/types',
    '@civica/config',
  ],
  // Turbopack config for production builds (next build uses Turbopack by default).
  turbopack: {},
  webpack(config, { dev }) {
    if (dev) {
      // npm workspaces symlinks packages/* into node_modules/@civica/*, so
      // Next.js watches both the real path and the symlink and fires a
      // rebuild on every save. Disabling symlink resolution in webpack stops
      // the double-watch and the constant reloads in dev.
      config.resolve.symlinks = false;
    }
    return config;
  },
};

export default nextConfig;
