module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Rewrites StyleSheet.create call sites so theme changes apply over JSI.
      // Without this, styles are static and never react to a theme switch.
      ['react-native-unistyles/plugin', { root: 'src' }],
      // Must stay LAST — the worklets plugin needs to run after every other
      // transform has finished rewriting the code it inspects.
      'react-native-worklets/plugin',
    ],
  };
};
