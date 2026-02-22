const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Ensure we don't try to use server features not available in Electron
    experimental: {
        outputFileTracingRoot: path.join(__dirname, '../../'),
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    }
};
module.exports = nextConfig;
