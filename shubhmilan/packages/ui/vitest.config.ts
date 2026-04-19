import { defineConfig } from 'vitest/config';

/**
 * Component tests run against react-native-web via jsdom. Metro's RN→RN-web alias
 * does the real swap in bundling; for tests we ask vitest to resolve the same way so
 * `import { View } from 'react-native'` lands on the web shim.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
});
