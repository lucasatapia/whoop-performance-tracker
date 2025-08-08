// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // 1) start with Expo's default
  const config = await createExpoWebpackConfigAsync(env, argv);

  // 2) alias “victory-native” → “victory” (for your charts)
  //    AND alias “expo-secure-store” → your web shim
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'victory-native': 'victory',
    'expo-secure-store': path.resolve(__dirname, 'lib', 'storage.ts'),
  };

  // 3) font handling: your existing rule, but unshifted
  const fontRule = {
    test: /\.(ttf|otf|woff2?|eot)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'static/fonts/[hash][ext]',
    },
  };
  // put it first so it doesn’t get swallowed by other rules
  config.module.rules.unshift(fontRule);

  return config;
};
