# Develop the Android app

The `mobile/` package runs a single screen with Trackcrow's web color palette. It needs no backend, token, or SMS permission.

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

Expect the Trackcrow heading and **A fresh start.** card. Reapply the reverse mapping after each reconnect. Port 3000 and a database are unnecessary for this screen.

For JavaScript changes, keep Metro running and edit this checkout. Verify Fast Refresh by changing a visible label, then reverting it, without reloading or restarting Metro.

## Troubleshoot the existing setup

| Symptom | Recovery |
| --- | --- |
| No device or `offline` | Check the phone's network and Wireless debugging, reconnect with its current connection port, then restore the reverse mapping. |
| Device repeatedly disconnects | Use only the SDK adb. Older adb binaries can restart its server. |
| Several development servers appear | Open the explicit port-8082 URL above. |
| `unexpected end of stream` at `127.0.0.1:8082` | Confirm Metro listens on IPv4 `127.0.0.1`. Restart with `NODE_OPTIONS=--dns-result-order=ipv4first`. |
| Source edits do not appear | Confirm Metro serves this checkout and `CI` is unset. Check a visible label. Use `--clear` only if the cache is stale. |
| Native build fails | Inspect the first compiler error in the build log. Keep the existing short checkout path and hoisted dependencies. |

Run `corepack pnpm dlx expo-doctor` when diagnosing dependency compatibility. Do not use an automatic dependency upgrade as a startup fix. Expo Doctor can flag newer patch releases while the pinned setup still builds; review that result separately from build failures.

## Preserve the verified SMS installation path

SMS reading was verified during the completed POC on a Pixel 10a. The current app removes SMS access. When that feature is implemented again, install through the SDK's adb and request runtime consent in the app. The verified installation had `RESTRICTION_INSTALLER_EXEMPT` for `READ_SMS`; granting with `adb install -g` alone was not evidence that an inbox query worked. Check permission flags without printing message contents.
