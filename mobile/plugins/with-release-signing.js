// Signs release builds with the TrackCrow release key instead of the debug key.
// The key's location and passwords are Gradle properties kept outside the
// repository, usually in ~/.gradle/gradle.properties. See docs/android.md.
const { withAppBuildGradle } = require('expo/config-plugins');

const PROPERTIES = [
  'TRACKCROW_RELEASE_STORE_FILE',
  'TRACKCROW_RELEASE_STORE_PASSWORD',
  'TRACKCROW_RELEASE_KEY_ALIAS',
  'TRACKCROW_RELEASE_KEY_PASSWORD',
];

// Generated blocks are marked so each prebuild replaces them with the current version.
const BEGIN = '// @generated begin with-release-signing';
const END = '// @generated end with-release-signing';
const GENERATED_BLOCK = /\n[ \t]*\/\/ @generated begin with-release-signing[\s\S]*?\/\/ @generated end with-release-signing/g;

const RELEASE_SIGNING_CONFIG = `        ${BEGIN}
        release {
            if (project.findProperty('TRACKCROW_RELEASE_STORE_FILE')) {
                storeFile file(project.findProperty('TRACKCROW_RELEASE_STORE_FILE'))
                storePassword project.findProperty('TRACKCROW_RELEASE_STORE_PASSWORD')
                keyAlias project.findProperty('TRACKCROW_RELEASE_KEY_ALIAS')
                keyPassword project.findProperty('TRACKCROW_RELEASE_KEY_PASSWORD')
            }
        }
        ${END}`;

// Only tasks that sign or package a release need the key. Lint and unit test tasks do not.
const MISSING_KEY_GUARD = `
${BEGIN}
// Fail a release build without the release key instead of signing it with the debug key.
gradle.taskGraph.whenReady { graph ->
    def missing = [${PROPERTIES.map((name) => `'${name}'`).join(', ')}].findAll { !project.findProperty(it) }
    def signsRelease = graph.allTasks.any { it.project == project && it.name in ['validateSigningRelease', 'packageRelease', 'signReleaseBundle'] }
    if (missing && signsRelease) {
        throw new GradleException("Release signing is not configured. Missing Gradle properties: \${missing.join(', ')}")
    }
}
${END}
`;

function replaceOnce(contents, pattern, replacement, description) {
  if (!pattern.test(contents)) {
    throw new Error(`with-release-signing: could not find ${description} in android/app/build.gradle`);
  }
  return contents.replace(pattern, replacement);
}

function addReleaseSigning(contents) {
  let result = contents.replace(GENERATED_BLOCK, '').trimEnd() + '\n';
  result = replaceOnce(
    result,
    /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.(debug|release)/,
    '$1signingConfig signingConfigs.release',
    'the release build type',
  );
  result = replaceOnce(result, /(signingConfigs \{\n)/, `$1${RELEASE_SIGNING_CONFIG}\n`, 'the signing configs');
  return `${result}${MISSING_KEY_GUARD}`;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = addReleaseSigning(gradleConfig.modResults.contents);
    return gradleConfig;
  });
};
