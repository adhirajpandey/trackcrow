// Inputs to the native fingerprint used by scripts/native-build-plan.js.
// Package scripts and .gitignore never change the generated Android project.
const sourceSkips = ['PackageJsonScriptsAll', 'GitIgnore'];
// The development client does not need rebuilding when the release version changes.
if (process.env.APP_VARIANT === 'development') sourceSkips.push('ExpoConfigVersions');

/** @type {import('expo/fingerprint').Config} */
module.exports = { sourceSkips };
