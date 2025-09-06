/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'fortnite-api.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  transpilePackages: ['firebase'],
  webpack: (config, { isServer }) => {
    // Handle Firebase Admin SDK and Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        'node:events': false,
        'node:process': false,
        'node:util': false,
        'node:fs': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:stream': false,
        'node:util': false,
        'node:buffer': false,
        'node:querystring': false,
        'node:url': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
        'node:net': false,
        'node:tls': false,
        'node:child_process': false,
      };
    }
    
    // Ensure proper module resolution for .mjs files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Exclude Firebase Admin SDK from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'firebase-admin',
        'google-auth-library': 'google-auth-library',
        'google-gax': 'google-gax',
        'google-logging-utils': 'google-logging-utils',
        'gcp-metadata': 'gcp-metadata',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
