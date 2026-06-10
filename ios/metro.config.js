const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const sharedSrc = path.resolve(__dirname, '../shared/src');
const config = getDefaultConfig(__dirname);

config.watchFolders = [sharedSrc];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@shared/')) {
    const subpath = moduleName.replace('@shared/', '');
    return context.resolveRequest(context, path.resolve(sharedSrc, subpath), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
