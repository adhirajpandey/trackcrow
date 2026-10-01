#!/usr/bin/env node
// Decides whether a persistent native build directory needs a native build, and whether that
// build needs `expo prebuild` first. Compare against the fingerprint of the last binary built
// from the same directory, with the same APP_VARIANT that prebuild and Gradle will use.
//
//   node scripts/native-build-plan.js plan <state-file>    prints a JSON plan
//   node scripts/native-build-plan.js record <state-file>  call after a successful build
//
// Plan statuses:
//   current   the installed binary matches; no native build
//   build     native sources changed; build with Gradle without prebuild
//   prebuild  the generated project is out of date; run prebuild, then build
//   uncertain a change this script cannot classify; exits 3 instead of guessing
const fs = require('node:fs');
const path = require('node:path');
const { createFingerprintAsync, diffFingerprints } = require('expo/fingerprint');

const projectRoot = path.resolve(__dirname, '..');
const variant = process.env.APP_VARIANT || 'production';

// Sources that prebuild turns into the generated android/ project.
const PREBUILD_REASONS = new Set([
  'expoConfig',
  'expoConfigPlugins',
  'expoConfigExternalFile',
  'expoCNGPatches',
  'package:react-native',
]);
// Native sources that Gradle autolinks and compiles directly.
const BUILD_REASONS = new Set(['expoAutolinkingAndroid', 'rncoreAutolinkingAndroid']);

function describe(item) {
  const source = item.op === 'added' ? item.addedSource : item.op === 'removed' ? item.removedSource : item.afterSource;
  return { op: item.op, source: source.type === 'contents' ? source.id : source.filePath, reasons: source.reasons };
}

function readState(stateFile) {
  if (!fs.existsSync(stateFile)) return null;
  return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
}

function classify(changes) {
  if (changes.some((change) => change.reasons.some((reason) => PREBUILD_REASONS.has(reason)))) {
    return { status: 'prebuild', reason: 'Generated project inputs changed (Expo config, config plugins, or React Native).' };
  }
  const unknown = changes.filter((change) => !change.reasons.every((reason) => BUILD_REASONS.has(reason)));
  if (unknown.length > 0) {
    return { status: 'uncertain', reason: 'Some changed native sources have unclassified reasons. Decide whether prebuild is needed, then build explicitly.' };
  }
  return { status: 'build', reason: 'Only autolinked native sources changed.' };
}

async function plan(stateFile) {
  const fingerprint = await createFingerprintAsync(projectRoot, { platforms: ['android'] });
  fs.writeFileSync(`${stateFile}.next`, JSON.stringify({ variant, fingerprint }));

  const state = readState(stateFile);
  let result;
  if (state && state.variant !== variant) {
    result = { status: 'uncertain', reason: `This directory was last built as "${state.variant}", not "${variant}". Use the directory for this variant.`, changes: [] };
  } else if (!fs.existsSync(path.join(projectRoot, 'android', 'app', 'build.gradle'))) {
    result = { status: 'prebuild', reason: 'No generated Android project exists.', changes: [] };
  } else if (!state) {
    result = { status: 'prebuild', reason: 'No native build is recorded for this directory.', changes: [] };
  } else {
    const changes = diffFingerprints(state.fingerprint, fingerprint).map(describe);
    result = changes.length === 0
      ? { status: 'current', reason: 'The native fingerprint is unchanged.', changes }
      : { ...classify(changes), changes };
  }
  console.log(JSON.stringify({ variant, hash: fingerprint.hash, ...result }, null, 2));
  if (result.status === 'uncertain') process.exitCode = 3;
}

function record(stateFile) {
  fs.renameSync(`${stateFile}.next`, stateFile);
}

const [command, stateFile] = process.argv.slice(2);
if (!stateFile || (command !== 'plan' && command !== 'record')) {
  console.error('Usage: native-build-plan.js plan|record <state-file>');
  process.exit(2);
}
if (command === 'record') record(path.resolve(stateFile));
else plan(path.resolve(stateFile)).catch((error) => {
  console.error(error);
  process.exit(1);
});
