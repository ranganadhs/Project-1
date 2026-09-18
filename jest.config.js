// Packages shipping untranspiled ESM that Jest must transform rather than ignore.
const TRANSPILE = [
  // pnpm stores every real package under node_modules/.pnpm/<pkg>/node_modules/<pkg>.
  // Without allowing `.pnpm` here, the FIRST `node_modules/` in that path matches
  // the ignore pattern and nothing beneath it is ever transformed — so the real
  // package name below never gets a chance to be considered.
  '\\.pnpm',
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?/.*',
  '@expo-google-fonts/.*',
  'react-navigation',
  '@react-navigation/.*',
  // expo-router re-exports this from its own entry, so importing `Stack` in a
  // test pulls it in. It ships untranspiled ESM.
  'standard-navigation',
  '@sentry/react-native',
  'native-base',
  'react-native-svg',
  'react-native-unistyles',
  'react-native-nitro-modules',
  '@react-native-vector-icons/.*',
];

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The ESLint rule test is run directly by node via the `test` script; letting
  // jest also collect it would run RuleTester twice.
  testPathIgnorePatterns: ['<rootDir>/eslint-rules/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // No trailing slash after the group: these are PREFIX matches, so `expo`
  // covers expo-modules-core, expo-router, and friends.
  transformIgnorePatterns: [`node_modules/(?!(${TRANSPILE.join('|')}))`],
};
