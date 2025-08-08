// frontend/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["module-resolver", { root: ["."], alias: { "@": "./" } }],
      "react-native-reanimated/plugin", // keep last if you use reanimated
    ],
  };
};
