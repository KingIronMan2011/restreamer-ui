import pkg from '../../package.json';

const Core = '^16.11.0';
const FFmpeg = '^5.1.0 || ^6.1.0 || ^7.0.0 || ^8.1.0 || ^9.0.0';
const getUIVersion = (metadata: typeof pkg) =>
  metadata.bundle ? metadata.bundle : metadata.name + ' v' + metadata.version;
const UI = getUIVersion(pkg);
const Version = pkg.version;

export { Core, FFmpeg, UI, Version, getUIVersion };
