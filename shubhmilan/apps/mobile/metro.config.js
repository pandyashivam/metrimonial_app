// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// Monorepo root
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Fix Windows backslash issue in static file paths
const originalGetTransformOptions = config.transformer?.getTransformOptions;
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => {
    const options = originalGetTransformOptions
      ? await originalGetTransformOptions()
      : {};
    return {
      ...options,
      transform: {
        ...options?.transform,
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    };
  },
};

// 4. Fix Windows path separators in the serializer
const originalCustomSerializer = config.serializer?.customSerializer;
config.serializer = {
  ...config.serializer,
  customSerializer: originalCustomSerializer,
};

// Force forward slashes on Windows for web platform
const origResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Normalize backslashes to forward slashes for web
  if (platform === 'web' && moduleName.includes('\\')) {
    moduleName = moduleName.replace(/\\/g, '/');
  }
  if (origResolveRequest) {
    return origResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
