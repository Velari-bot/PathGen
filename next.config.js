/** @type {import('next').NextConfig} */
const nextConfig = {
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
    
    // Exclude functions directory completely
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase-functions': false,
      'firebase-admin': false,
    };
    
    return config;
  },
}

module.exports = nextConfig
