// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Fix .js extension imports in .ts files (ESM convention used by shared packages).
//    When Metro encounters `from './foo.js'` inside a .ts file, it can't find `foo.js`
//    because the actual file is `foo.ts`. We strip the .js and let Metro re-resolve.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only transform relative imports ending in .js
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const stripped = moduleName.slice(0, -3);
    try {
      // Try resolving without .js first (will find .ts, .tsx, etc.)
      if (originalResolveRequest) {
        return originalResolveRequest(context, stripped, platform);
      }
      return context.resolveRequest(context, stripped, platform);
    } catch {
      // Fall through to original resolution if stripping doesn't work
    }
  }

  // Normalize backslashes on Windows
  if (platform === 'web' && moduleName.includes('\\')) {
    moduleName = moduleName.replace(/\\/g, '/');
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
