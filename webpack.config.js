// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async (env, argv) => {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // ← ALIAS victory-native → victory for web
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'victory-native': 'victory',
  };

  // ← your existing font rule, unshifted
  const fontRule = {
    test: /\.(ttf|otf|woff2?|eot)$/i,
    type: 'asset/resource',
    generator: { filename: 'static/fonts/[hash][ext]' },
  };
  config.module.rules = [fontRule, ...config.module.rules];

  return config;
};
