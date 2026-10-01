# Develop the Android app

The `mobile/` package follows the web app's Warm Ledger design (`DESIGN.md`), fonts, and colors. Its root Stack contains four tabs: **Overview**, **Txns**, **Insights**, and **More**. Overview shows month-to-date spending, review work, top categories, and recent transactions. More links to Recipients, Rules, Categories, Accounts, Settings, and Diagnostics. Settings signs in with Google, or connects with a personal access token as a fallback. While signed in with permission, the app captures new Kotak/HDFC bank SMS for server import.

## Choose the loop

Run Gradle only when the native runtime changed. Most work is JavaScript or TypeScript, and it needs only Metro and the installed development client.

| Work | Command | Native build |
| --- | --- | --- |
| Screens, hooks, API calls, styles | Metro with Fast Refresh in **TrackCrow Dev** | Never |
| Native dependency, Kotlin, config plugin, or app config | Rebuild **TrackCrow Dev** after the native build plan says so | Only when the plan is not `current` |
| Feature acceptance on the phone | Mobile checks, then focused device checks | No |
| Standalone test APK or release | Release build of **TrackCrow** | Yes |

`APP_VARIANT=development` selects **TrackCrow Dev** (`app.trackcrow.mobile.dev`, scheme `trackcrow-dev`). Without it, the config is the production app, **TrackCrow** (`app.trackcrow.mobile`). The two apps install side by side, so a development build never replaces the release app or its sign-in. Never change the package name temporarily to get a separate install.

Build each variant in its own long-lived checkout. Each keeps its generated `android/` folder, native C++ output (`.cxx`), and `node_modules`. Do not switch one checkout between variants: the package name is part of the generated project. Task worktrees are for editing and running Metro, not for native builds. A cold native build takes over ten minutes; a warm one takes under a minute.

Treat `gradlew clean`, deleting `android/`, `.cxx` or `node_modules`, and `expo start --clear` as recovery steps, not routine.

### Decide whether a native build is needed

From `mobile/` in the build checkout, with the same `APP_VARIANT` that prebuild and Gradle will use:

```sh
node scripts/native-build-plan.js plan ../.trackcrow-native-fingerprint
```

It compares the Expo native fingerprint (`fingerprint.config.js`) with the one recorded after that checkout's last successful build, and prints one status:

| Status | Meaning |
| --- | --- |
| `current` | The installed binary matches. Use Metro. |
| `build` | Only autolinked native sources changed, such as a Kotlin module or a native dependency. Build with Gradle without prebuild. |
| `prebuild` | The generated project is out of date: no project exists, no build is recorded, or the Expo config, a config plugin, or React Native changed. The plan names the reason. Run prebuild, then build. |
| `uncertain` | A change the script cannot classify, or a checkout last built as the other variant. It exits with status 3. Decide explicitly instead of running prebuild by default. |

After a successful build, record it:

```sh
node scripts/native-build-plan.js record ../.trackcrow-native-fingerprint
```

Recording fingerprints the checkout again after the build, because prebuild creates `android/` and Gradle can rewrite files inside native packages. The development variant ignores `version` and `versionCode`, so a release version bump does not rebuild the development client.

Prebuild is the expensive path. It deletes and recreates `android/`, so the next build reconfigures and recompiles the C++ of every native library. A Kotlin-only change rebuilt in seconds; the same checkout after prebuild took about four minutes.

## App shell

Routes outside `(tabs)` open in the root Stack. Transaction detail (`transactions/[id]`), add transaction (`transactions/new`), review, recipient list and detail, rules, categories, accounts, diagnostics, and onboarding reuse `ComingSoon` until their screens are implemented. Settings keeps its existing behavior as a stack route. Android Back returns to the previous screen. The review badge and **Review now** open the review placeholder; **Add expense** opens the add placeholder. The existing `TabButton`, theme, and base UI components are unchanged.

Shared components live in `src/components/`: `TextField`, `AmountField`, `Sheet`, `SelectSheet`, `CategorySheet`, `TransactionRow`, `EmptyState`, `ConfirmDialog`, `StickySaveBar`, and `ToastHost`. Sheets have one 75% snap point and disable dynamic sizing. Category selection has search, caller-provided recent categories, and all categories. Transaction rows announce recipient, amount, classification, payment type, account, and date/time together. Toasts support Undo, live-region announcements, Android's recommended timeout, and reduced motion.

The exact native dependency pins are gesture-handler 2.32.0, bottom-sheet 5.2.14, FlashList 2.3.2, datetimepicker 9.1.0, and expo-haptics 57.0.3. Rebuild the development client after installing this shell. FlashList v2 uses the New Architecture; later screens can use the Android date picker's imperative API. Charts can use the existing SVG dependency.

`src/lib/api/` separates the HTTP client, auth, dashboard, transactions, recipients, rules, categories, and accounts. Its typed functions target the existing routes documented in [the API reference](api.md); unused functions prepare later screens and do not add server endpoints. The index export keeps auth and SMS imports compatible. Errors preserve `message`, `code`, `issues`, and conflict `details`; 403 wording applies to the requested action. A 401 from an authenticated ledger request clears the rejected session and pending SMS through the existing sign-out flow, cancels cached queries, and opens Settings with **Sign in again**. A late response for a different session cannot sign out the current session. Query keys in `src/lib/query-keys.ts` share list and summary prefixes for mutation invalidation and contain no tokens.

### Verify the shell on a development client

Run `corepack pnpm check`, rebuild the development client, and open each tab and stack route. In **More → Diagnostics**, development builds show **App shell preview**. Open the category sheet, check search and the Recent row, and select a category. Use **Show toast**, then **Undo**. This preview uses in-memory sample options and writes no ledger data. It is hidden in release builds. Check Android Back dismisses the sheet and returns from stack routes. Repeat a row check with a large system font size.

## Use the installed toolchain

Use Node.js 22.13 or newer, JDK 17, the existing Android SDK, and Corepack with pnpm 10.28.2. Keep `mobile/.npmrc` set to `node-linker=hoisted`. Dependencies and the lockfile remain at the versions verified during device setup.

On an already configured machine, reuse its environment and startup helpers. Do not reinstall tools, relocate caches, regenerate the lockfile, or reset a database to start the app.

For a fresh checkout, set `JAVA_HOME` and `ANDROID_HOME`, add the SDK's `platform-tools` to PATH, then run:

```sh
cd mobile
corepack pnpm install --frozen-lockfile
corepack pnpm check
```

## Connect over wireless debugging

Enable Wireless debugging on the phone. Use only the SDK's adb binary throughout the session.

```sh
# Pair only when this computer is not already authorized. Enter the code locally.
adb pair <address>:<pairing-port>
adb connect <address>:<connection-port>
adb devices -l
```

The connection port differs from the pairing port and can change. Use `adb -s <device>` for subsequent commands. If two transports identify the same phone, disconnect the unused transport before building.

## Build the development client

Build **TrackCrow Dev** in its own long-lived checkout, and only when the native build plan is not `current`. From `mobile/`, with `APP_VARIANT=development` set for every command:

```sh
export APP_VARIANT=development
node scripts/native-build-plan.js plan ../.trackcrow-native-fingerprint
# Only when the plan says prebuild:
corepack pnpm exec expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
adb -s <device> install -r app/build/outputs/apk/debug/app-debug.apk
cd ..
node scripts/native-build-plan.js record ../.trackcrow-native-fingerprint
```

In PowerShell, set `$env:APP_VARIANT = 'development'` instead. `arm64-v8a` covers current phones; add other ABIs only for a device that needs them. The first build downloads native tools and compiles all native code. On the configured Windows machine, its development build helper runs these steps. Keep generated `android/` files out of Git.

## Start Metro and open the app

From `mobile/`, in PowerShell:

```powershell
Remove-Item Env:CI -ErrorAction SilentlyContinue
$env:NODE_OPTIONS = '--dns-result-order=ipv4first'
$env:APP_VARIANT = 'development'
corepack pnpm exec expo start --dev-client --localhost --port 8082
```

Metro can serve any checkout, including a task worktree, while the installed development client stays the same. In a second shell:

```sh
adb -s <device> reverse tcp:8082 tcp:8082
adb -s <device> shell am start -a android.intent.action.VIEW -d "exp+trackcrow-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082" app.trackcrow.mobile.dev
```

Expect the TrackCrow header and the **Connect TrackCrow** card on Overview. Reapply the reverse mapping after each reconnect.

## Connect to a backend

Overview reads `GET /api/dashboard/summary`, `GET /api/dashboard/spending-by-category`, and `GET /api/transactions` with a TrackCrow token kept in SecureStore.

Settings has an editable server URL, prefilled with `https://trackcrow.in`. **Sign in with Google** fetches the server's web client ID from `GET /api/mobile/auth/google`, opens the Credential Manager account picker, and exchanges the Google ID token at `POST /api/mobile/auth/google`. The server returns a token labelled `Android app` with `transactions:read`, `transactions:write`, and `sms:import`, and it appears in web Settings. The Google ID token is never stored. **Sign out** revokes that token on the server, clears the Google credential state, and removes local credentials. If the server cannot be reached, the app still signs out locally and says the token could not be revoked; revoke it from web Settings.

**Use an access token instead** is a fallback. Use a personal access token with `transactions:read` and `sms:import`. Saving validates dashboard access with a one-row transactions request before storing anything. A token without SMS access makes import show **Sign in again** after the first 403 response.

### Automatic SMS import

Before using this build with real SMS, deploy the server's extended SMS import contract and the `sms:import` scope for newly issued Google app sessions. Existing Google sessions must sign in again to get that scope. The Android change sends the new fields; it does not implement or deploy the server change.

After sign-in and on app start, Android requests `RECEIVE_SMS` once if needed. A denial is remembered. Settings then shows **No SMS permission**, with an explicit **Grant** button or **Open app settings** link. There is no separate SMS opt-in. `READ_SMS` remains blocked, so only new arrivals are captured.

The native receiver accepts Kotak/HDFC sender headers, including operator prefixes, and joins multipart SMS. It assigns a UUID before starting Headless JS. The task reads the saved token and posts this payload with Bearer authentication:

```json
{
  "data": {
    "message": "<incoming SMS text>",
    "sender": "AD-HDFCBK",
    "idempotencyKey": "00000000-0000-4000-8000-000000000001",
    "timestamp": "2026-09-30T12:00:00.000Z"
  },
  "metadata": { "storeMessageBody": false }
}
```

The updated server parses the SMS and stores no body for this payload. The app persists pending text in its private AsyncStorage queue before sending; backups are disabled. The queue keeps at most 200 messages for seven days and drains on headless runs and app foregrounding. Retries retain the arrival UUID. Successful, ignored, duplicate, and 422 outcomes remove the text; 401/403 clears the rejected session's queue and shows **Sign in again**. Sign-out clears queue and import status. SMS bodies and credentials are never logged.

> [!WARNING]
> **TrackCrow Dev captures SMS too.** If TrackCrow and TrackCrow Dev both have `RECEIVE_SMS` and are signed in to the same account and server, Android delivers each bank SMS to both receivers. Each app assigns its own idempotency key, so the server imports the transaction twice. Unless you are testing SMS import, deny SMS permission in TrackCrow Dev or point it at a local backend.

Keep MacroDroid disabled when testing real imports through the app. Its requests have no shared idempotency key, so running both creates duplicates. Receiver delivery after swiping away, after a reboot and unlock, and on a manual APK install still need physical-device verification. Android **Force stop** is a separate stopped-package condition.

For a local backend, run it on port 3000 on the development computer, then:

```sh
adb -s <device> reverse tcp:3000 tcp:3000
```

In the app's Settings, change the server URL to `http://127.0.0.1:3000` before signing in.

For JavaScript changes, keep Metro running and edit the checkout it serves. Verify Fast Refresh by changing a visible label, then reverting it, without reloading or restarting Metro. A JavaScript or TypeScript change never needs Gradle.

### Configure Google sign-in

Google issues the ID token for the server's **web** OAuth client, which is the `GOOGLE_CLIENT_ID` the server already uses for web sign-in. Android also needs its own OAuth client in the **same** Google Cloud project, or Credential Manager fails with a developer error:

1. Print the signing certificate of the build you install. From `mobile/android` after prebuild, run `./gradlew signingReport` and copy the SHA-1 for the `debug` variant.
2. In Google Cloud Console → **APIs & Services** → **Credentials**, create an OAuth client of type **Android** with the build's package name and that SHA-1: `app.trackcrow.mobile.dev` for TrackCrow Dev, `app.trackcrow.mobile` for TrackCrow.
3. Rebuild is not needed. The client takes effect after Google propagates it, which can take a few minutes.

The native module comes from `react-native-nitro-google-signin` through autolinking. Its Expo config plugin is not used, because it only configures iOS and Firebase files. The app passes the web client ID at runtime.

Debug builds are signed with the public Android debug keystore. Register its SHA-1 only in a local or development Google Cloud project, never in the production project. For release builds, register the release key's SHA-1 in the production project. Print it with `keytool -list -v -keystore <release.keystore> -alias <alias>`.

## Build a release APK

A release APK carries its own JavaScript, so it runs without Metro. It is signed with the TrackCrow release key. Android installs an update only when it is signed with the same key as the installed app, so every release must use that key.

Before each release:

1. Increase `android.versionCode` in `app.json` by one. Change `version` when the release is noticeably different. Settings shows both at the bottom of the screen.
2. Check that the build machine's Gradle properties file (`$GRADLE_USER_HOME/gradle.properties`, by default `~/.gradle/gradle.properties`) has the release key settings:

   ```properties
   TRACKCROW_RELEASE_STORE_FILE=/absolute/path/to/release.keystore
   TRACKCROW_RELEASE_STORE_PASSWORD=...
   TRACKCROW_RELEASE_KEY_ALIAS=...
   TRACKCROW_RELEASE_KEY_PASSWORD=...
   ```

   The `with-release-signing` config plugin reads these. If any are missing, the release build stops with an error instead of signing with the debug key. Keep these values out of the repository.

Build from `mobile/`:

```sh
corepack pnpm check
corepack pnpm exec expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

`reactNativeArchitectures` limits native code to the two CPU types Android phones use. The default also includes `x86` and `x86_64`, which only emulators need. Leaving them in grew the APK from 60 MB to 106 MB when this was measured.

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. On the configured Windows machine, the release build helper runs these steps and copies the APK to a file named after the version.

Build releases in the production build checkout, never in the development one. TrackCrow Dev has its own package name, so it stays installed beside the release app. A debug build of the production config would share `app.trackcrow.mobile` with a different signing key and require uninstalling the release app, which removes its saved sign-in. Do not build one.

## Troubleshoot the existing setup

For a Pixel test APK, run mobile checks first and finish the code. In the production build checkout, run the native build plan without `APP_VARIANT`, prebuild only when it says `prebuild`, and run `corepack pnpm android:release:device` from `mobile/`. It builds a signed `arm64-v8a` APK without installing it. Record the plan after the build succeeds. Preserve the generated Android folder and native output between iterations. Use the two-ABI build above when sharing a release with other devices.

| Symptom | Recovery |
| --- | --- |
| No device or `offline` | Check the phone's network and Wireless debugging, reconnect with its current connection port, then restore the reverse mapping. |
| Device repeatedly disconnects | Use only the SDK adb. Older adb binaries can restart its server. |
| Several development servers appear | Open the explicit port-8082 URL above. |
| `unexpected end of stream` at `127.0.0.1:8082` | Confirm Metro listens on IPv4 `127.0.0.1`. Restart with `NODE_OPTIONS=--dns-result-order=ipv4first`. |
| Source edits do not appear | Confirm Metro serves this checkout and `CI` is unset. Check a visible label. Use `--clear` only if the cache is stale. |
| Google sign-in fails with a developer error | Check that an Android OAuth client with this build's package name and SHA-1 exists in the same project as the server's web client. |
| Release build fails with `Filename longer than 260 characters` | On Windows, enable long paths (`LongPathsEnabled` in the registry) and build with an SDK CMake whose ninja is 1.12 or newer, for example CMake 3.31, by setting `cmake.dir` in `android/local.properties`. The SDK's default CMake 3.22 ships an older ninja. |
| Native build fails | Inspect the first compiler error in the build log. Keep the existing short checkout path and hoisted dependencies. |

Run `corepack pnpm dlx expo-doctor` when diagnosing dependency compatibility. Do not use an automatic dependency upgrade as a startup fix. Expo Doctor can flag newer patch releases while the pinned setup still builds; review that result separately from build failures.

## Preserve the verified SMS installation path

SMS reading was verified during the completed POC on a Pixel 10a with an adb-installed build. That installation had `RESTRICTION_INSTALLER_EXEMPT` for `READ_SMS`; `adb install -g` alone did not establish inbox access. The import app uses `RECEIVE_SMS` only. Verify runtime consent and actual incoming SMS delivery separately on a manually installed release. Check permission flags without printing message contents.
