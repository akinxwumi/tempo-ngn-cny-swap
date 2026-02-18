/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '../.next',
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that are not needed for web
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      'lokijs': false,
      'encoding': false,
    };

    // Ignore specific modules that cause warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
    ];

    return config;
  },
};

module.exports = nextConfig;
