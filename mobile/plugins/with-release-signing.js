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

const RELEASE_SIGNING_CONFIG = `
        release {
            if (project.findProperty('TRACKCROW_RELEASE_STORE_FILE')) {
                storeFile file(project.findProperty('TRACKCROW_RELEASE_STORE_FILE'))
                storePassword project.findProperty('TRACKCROW_RELEASE_STORE_PASSWORD')
                keyAlias project.findProperty('TRACKCROW_RELEASE_KEY_ALIAS')
                keyPassword project.findProperty('TRACKCROW_RELEASE_KEY_PASSWORD')
            }
        }`;

const MISSING_KEY_GUARD = `
// Fail a release build without the release key instead of signing it with the debug key.
gradle.taskGraph.whenReady { graph ->
    def missing = [${PROPERTIES.map((name) => `'${name}'`).join(', ')}].findAll { !project.findProperty(it) }
    def buildsRelease = graph.allTasks.any { it.project == project && it.name.toLowerCase().contains('release') }
    if (missing && buildsRelease) {
        throw new GradleException("Release signing is not configured. Missing Gradle properties: \${missing.join(', ')}")
    }
}
`;

function replaceOnce(contents, pattern, replacement, description) {
  if (!pattern.test(contents)) {
    throw new Error(`with-release-signing: could not find ${description} in android/app/build.gradle`);
  }
  return contents.replace(pattern, replacement);
}

function addReleaseSigning(contents) {
  // Prebuild without --clean runs mods again on an already modified file.
  if (contents.includes('TRACKCROW_RELEASE_STORE_FILE')) return contents;
  let result = replaceOnce(
    contents,
    /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
    '$1signingConfig signingConfigs.release',
    'the release build type',
  );
  result = replaceOnce(
    result,
    /(signingConfigs \{\s*debug \{[\s\S]*?\n\s*\})/,
    `$1${RELEASE_SIGNING_CONFIG}`,
    'the debug signing config',
  );
  return `${result}${MISSING_KEY_GUARD}`;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = addReleaseSigning(gradleConfig.modResults.contents);
    return gradleConfig;
  });
};
