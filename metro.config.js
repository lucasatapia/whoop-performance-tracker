// metro.config.js  — root of your project
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // 1️⃣ Treat .wasm like a static asset
  config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

  // 2️⃣ Map any `victory-native` import to the `victory` folder
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'victory-native': path.resolve(__dirname, 'node_modules', 'victory'),
  };

  // 3️⃣ Serve WASM with correct MIME + cross-origin headers
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => (req, res, next) => {
      if (req.url.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    },
  };

  return config;
})();
