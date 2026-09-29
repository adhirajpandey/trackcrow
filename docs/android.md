# Develop the Android app

The `mobile/` package follows the web app's Warm Ledger design (`DESIGN.md`), fonts, and colors. It has five tabs named after the web sections. Overview shows month-to-date spending, review work, top categories, and recent transactions. Settings signs in with Google, or connects with a personal access token as a fallback. Transactions, Recipients, and Rules are placeholders. The app does not read SMS.

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

From `mobile/`:

```sh
corepack pnpm check
corepack pnpm exec expo prebuild --platform android --no-install
corepack pnpm exec expo run:android --no-bundler
```

Select the authorized phone if prompted. On the configured Windows machine, use its build helper to select `ANDROID_SERIAL`. The first build downloads native tools. Rebuild after changes to native modules, dependencies, or `app.json`. Keep generated `android/` files out of Git. Use the development client for this workflow.

## Start Metro and open the app

From `mobile/`, in PowerShell:

```powershell
Remove-Item Env:CI -ErrorAction SilentlyContinue
$env:NODE_OPTIONS = '--dns-result-order=ipv4first'
corepack pnpm exec expo start --dev-client --localhost --port 8082
```

In a second shell:

```sh
adb -s <device> reverse tcp:8082 tcp:8082
adb -s <device> shell am start -a android.intent.action.VIEW -d "exp+trackcrow-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082" app.trackcrow.mobile
```

Expect the TrackCrow header and the **Connect TrackCrow** card on Overview. Reapply the reverse mapping after each reconnect.

## Connect to a backend

Overview reads `GET /api/dashboard/summary`, `GET /api/dashboard/spending-by-category`, and `GET /api/transactions` with a TrackCrow token kept in SecureStore.

Settings has an editable server URL, prefilled with `https://trackcrow.in`. **Sign in with Google** fetches the server's web client ID from `GET /api/mobile/auth/google`, opens the Credential Manager account picker, and exchanges the Google ID token at `POST /api/mobile/auth/google`. The server returns a token labelled `Android app` with `transactions:read` and `transactions:write`, and it appears in web Settings. The Google ID token is never stored. **Sign out** revokes that token on the server, clears the Google credential state, and removes local credentials. If the server cannot be reached, the app still signs out locally and says the token could not be revoked; revoke it from web Settings.

**Use an access token instead** is a fallback. Paste a personal access token with `transactions:read` (the **Read only** preset in web Settings). Saving validates access with a one-row transactions request before storing anything.

For a local backend, run it on port 3000 on the development computer, then:

```sh
adb -s <device> reverse tcp:3000 tcp:3000
```

In the app's Settings, change the server URL to `http://127.0.0.1:3000` before signing in.

For JavaScript changes, keep Metro running and edit this checkout. Verify Fast Refresh by changing a visible label, then reverting it, without reloading or restarting Metro.

### Configure Google sign-in

Google issues the ID token for the server's **web** OAuth client, which is the `GOOGLE_CLIENT_ID` the server already uses for web sign-in. Android also needs its own OAuth client in the **same** Google Cloud project, or Credential Manager fails with a developer error:

1. Print the signing certificate of the build you install. From `mobile/android` after prebuild, run `./gradlew signingReport` and copy the SHA-1 for the `debug` variant.
2. In Google Cloud Console → **APIs & Services** → **Credentials**, create an OAuth client of type **Android** with package name `app.trackcrow.mobile` and that SHA-1.
3. Rebuild is not needed. The client takes effect after Google propagates it, which can take a few minutes.

The native module comes from `react-native-nitro-google-signin` through autolinking. Its Expo config plugin is not used, because it only configures iOS and Firebase files. The app passes the web client ID at runtime.

Debug builds are signed with the public Android debug keystore. Register its SHA-1 only in a local or development Google Cloud project, never in the production project. A production build needs a release keystore and its own SHA-1 registered in the production project.

## Troubleshoot the existing setup

| Symptom | Recovery |
| --- | --- |
| No device or `offline` | Check the phone's network and Wireless debugging, reconnect with its current connection port, then restore the reverse mapping. |
| Device repeatedly disconnects | Use only the SDK adb. Older adb binaries can restart its server. |
| Several development servers appear | Open the explicit port-8082 URL above. |
| `unexpected end of stream` at `127.0.0.1:8082` | Confirm Metro listens on IPv4 `127.0.0.1`. Restart with `NODE_OPTIONS=--dns-result-order=ipv4first`. |
| Source edits do not appear | Confirm Metro serves this checkout and `CI` is unset. Check a visible label. Use `--clear` only if the cache is stale. |
| Google sign-in fails with a developer error | Check that an Android OAuth client with package `app.trackcrow.mobile` and this build's SHA-1 exists in the same project as the server's web client. |
| Native build fails | Inspect the first compiler error in the build log. Keep the existing short checkout path and hoisted dependencies. |

Run `corepack pnpm dlx expo-doctor` when diagnosing dependency compatibility. Do not use an automatic dependency upgrade as a startup fix. Expo Doctor can flag newer patch releases while the pinned setup still builds; review that result separately from build failures.

## Preserve the verified SMS installation path

SMS reading was verified during the completed POC on a Pixel 10a. The current app removes SMS access. When that feature is implemented again, install through the SDK's adb and request runtime consent in the app. The verified installation had `RESTRICTION_INSTALLER_EXEMPT` for `READ_SMS`; granting with `adb install -g` alone was not evidence that an inbox query worked. Check permission flags without printing message contents.
