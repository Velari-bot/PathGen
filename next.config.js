/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude functions directory from Next.js build
  webpack: (config, { isServer }) => {
    // Exclude Firebase Functions from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Exclude functions directory
    config.externals = config.externals || [];
    config.externals.push({
      'firebase-functions': 'firebase-functions',
      'firebase-admin': 'firebase-admin',
    });
    
    return config;
  },
  // Exclude functions from build
  transpilePackages: [],
  // Ignore patterns
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
