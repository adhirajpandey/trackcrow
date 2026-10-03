# Develop the Android app

The `mobile/` package follows the web app's Warm Ledger design (`DESIGN.md`), fonts, and colors. Its root Stack contains four tabs: **Overview**, **Txns**, **Insights**, and **More**. Overview shows month-to-date spending, review work, top categories, and recent transactions. Uncategorized work appears as a yellow review card, category tiles carry a share bar, and the days-left label turns red in the last three days. A month with no transactions replaces the spending card with a dashed "fresh month" panel offering **Add expense** and, unless SMS import is on, **Run setup again**. The header review badge stays visible at 0. Transactions supports search, filters, classification, manual entry, editing, and deletion. The review queue files uncategorized transactions one at a time. More links to Recipients, Rules, Categories, Accounts, Settings, and Diagnostics. Settings signs in with Google, or connects with a personal access token as a fallback. While signed in with permission, the app captures new Kotak/HDFC bank SMS for server import.

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

Routes outside `(tabs)` open in the root Stack. Overview, Transactions, transaction detail, manual entry, the review queue, Recipients, Rules, Insights, Categories, Accounts, and Settings are implemented. Onboarding covers first-run setup; Diagnostics previews and sends user-requested reports. Android Back returns to the previous screen.

Insights offers this month, last month, last 3/6/12 months, this year, and a custom IST range. It shows total spending and transaction count, a previous-period comparison, bank coverage from cached SMS configuration, category shares, a day/week/month trend, and the five largest transactions. This month compares the same days last month, clamped to that month's end; other ranges compare the immediately preceding range with the same number of days. Category bars open filtered Transactions; Uncategorized opens the review queue. Trend bars open Transactions for their period, clipped to the selected range. Largest rows open that recipient's Transactions within the selected range, and **See all** opens the full range sorted by amount. Charts include text values, and each data section has loading, error, retry, and empty states. Pull to refresh reloads the sections.

More groups Recipients, Rules, Categories, and Accounts separately from Settings and Diagnostics, with a description for each row and the signed-in email and version at the bottom. Categories supports category and subcategory creation, rename, deletion, and reset to defaults. Deletion and reset confirmations explain the effect on transaction classification and rules requiring repair. Accounts supports creation and rename; the API has no deletion. Both editors show duplicate-name errors inline. Settings keeps Google sign-in, sign-out, SMS import status, and version visible. Its server URL and access-token fallback live in **Advanced**, collapsed by default.

Shared components live in `src/components/`: `TextField`, `AmountField`, `Sheet`, `SelectSheet`, `CategorySheet`, `TransactionRow`, `EmptyState`, `ConfirmDialog`, `StickySaveBar`, and `ToastHost`. Sheets have one 75% snap point and disable dynamic sizing. Category selection has search, caller-provided recent categories, and all categories. Transaction rows announce recipient, amount, classification, payment type, account, and date/time together. Toasts support Undo, live-region announcements, Android's recommended timeout, and reduced motion.

The exact native dependency pins are gesture-handler 2.32.0, bottom-sheet 5.2.14, FlashList 2.3.2, datetimepicker 9.1.0, and expo-haptics 57.0.3. Rebuild the development client after installing this shell. FlashList v2 uses the New Architecture; later screens can use the Android date picker's imperative API. Charts can use the existing SVG dependency.

`src/lib/api/` separates the HTTP client, auth, dashboard, transactions, recipients, rules, categories, and accounts. Its typed functions target the existing routes documented in [the API reference](api.md); unused functions prepare later screens and do not add server endpoints. The index export keeps auth and SMS imports compatible. Errors preserve `message`, `code`, `issues`, and conflict `details`; 403 wording applies to the requested action. A 401 from an authenticated ledger request clears the rejected session and pending SMS through the existing sign-out flow, cancels cached queries, and opens Settings with **Sign in again**. A late response for a different session cannot sign out the current session. Query keys in `src/lib/query-keys.ts` share list and summary prefixes for mutation invalidation and contain no tokens.

## Onboarding and Diagnostics

First run opens setup: welcome, Google sign-in, supported bank selection, an SMS explainer, permission, optional account naming, and Overview. Bank names come from the cached SMS config, with Kotak and HDFC as the fallback. The unsupported-bank path uses manual tracking and never requests SMS permission. Its optional **Request my bank** sends the bank name to `POST /api/mobile/diagnostics` with kind `bank_request`.

Setup completion and manual/SMS mode are saved per server URL. Existing signed-in users with an SMS permission decision or granted permission skip setup on upgrade. **Settings → Run setup again** resets completion. The server URL and token fallback stay in **Settings → Advanced**.

The SMS explainer says that Android's permission is broad, TrackCrow acts only on supported bank senders, and matching text goes to the server for parsing without being stored there. Only new arrivals are captured; there is no past-SMS import. Manual expenses work when permission is denied.

If a sideloaded APK is denied immediately without a system dialog, Android may have blocked restricted settings. Open **App info → ⋮ → Allow restricted settings**, return to setup, and retry. If permission was permanently denied, enable SMS under **App info → Permissions**. A rapid denial is a hint, not proof of a restriction.

**More → Diagnostics** shows the app version and versionCode, Android version and model, SMS permission, config version and last fetch, pending queue count, last import, and sign-in state. **Preview report** freezes the exact JSON for **Send report**. Editing the optional note clears the preview. Previewing uploads nothing. Sending needs sign-in and stores the report on the server; the optional note is included as shown. Avoid personal and financial details in notes.

The debug log persists the last 500 structured events. Attribute keys and string values come from fixed lists; SMS text, tokens, emails, recipient names, UPI IDs, references, and amounts are dropped when written. Storage failures do not interrupt SMS import. Reports are capped at 256 KiB, with a shared limit of 10 reports or bank requests per user per 24-hour window. The app displays the server's retry time on a rate-limit response.

Verify setup once the feature is complete: fresh supported-bank setup with permission allowed and denied, unsupported-bank setup with a bank request, upgrade skipping setup, account naming, manual expenses, and Diagnostics preview/send. Confirm report storage only against a local database. Check Overview and Transactions for manual mode, waiting for new SMS, uncategorized work, and all caught up.

## Transactions and review

Transactions uses 30-entry pages from the existing transaction endpoint, a debounced server search, and a draft filter sheet with **Clear** and **Apply**. Filter state lives in route params (`q`, `category`, `subcategory`, `classificationSource`, `recipientUuid`, `sortBy`, `sortOrder`, `startDate`, `endDate`). Multiple category, subcategory, and classification-source values are JSON arrays so names containing commas survive navigation. Category filters use names, including `Uncategorized`; recipient filters use UUIDs. Date params are inclusive `YYYY-MM-DD` dates in IST. With no date params, the list covers all time. Period chips select this month or either of the previous two months; **Custom** accepts a date range or all time.

The filter's source choices are classification provenance: Manual, Suggestion, and Rule. The API does not filter transaction capture source. The summary shows the matching entry count and the amount of loaded entries. Sticky IST day headers also total loaded entries. Date sorting groups contiguous days; amount sorting preserves the server's order and can repeat a day header. Pull to refresh and **Load more** remain available alongside automatic pagination.

Tap a category chip or **Classify now** to open `CategorySheet`. Selecting a category saves immediately and offers Undo. **Ignore** asks for confirmation before creating or replacing a recipient ignore rule. It affects future SMS imports only; the current transaction remains in the ledger and review queue.

Transaction detail includes recipient and rule links, a category grid, subcategory selection, **Suggest**, and classification provenance. Amount, payment type, IST date/time, account, reference, remarks, and location can be edited. Field changes use the sticky save bar; classification saves immediately. An unchanged visible time preserves the stored timestamp's seconds. Location opens a Maps search. Deletion has its own danger zone and confirmation.

After classification, the shared rule prompt offers **Create rule**, or **Replace rule** if the recipient already has one. Its optional **Also file N uncategorized** action snapshots matching transaction IDs, then checks and files each one with a separate category request. It skips entries already categorized and keeps remaining IDs for retry after a partial failure. No bulk endpoint is used.

Add transaction starts with the amount keypad, then recipient search and creation, optional category/subcategory, and payment details. Recent recipients are available in the picker. Saving returns to Transactions with a toast.

Review shows one uncategorized transaction, its remaining count, a suggestion and recent category choices, **More…**, **Skip**, and **Ignore**. Picking a category saves, advances, gives light haptic feedback, and announces the category and remaining count. The toast offers Undo. If Undo fails, the toast shows the server error and the rule prompt stays open. Ledger queries refresh after both successful and failed restoration. Skipping changes only the current visit; it does not mark a transaction reviewed. When no uncategorized entries remain, the queue says **You're all caught up.**

### Verify the transaction flows on a development client

Run `corepack pnpm check` in `mobile/`. This includes the `node:test` helpers for IST ranges, route params, day grouping, and form conversion. Use the existing development client with the local backend and a sign-in that has `transactions:write`.

1. Open Transactions from Overview's **See all** and open a recent row. Verify the badge opens the all-time review queue while **Review now** retains its card's period.
2. Search, apply multiple categories and classification sources, change periods, and sort by date and amount. Check refresh, sticky day totals, **Load more**, and filtered empty states. Loaded sums should increase as pages load.
3. Classify a row, dismiss the rule prompt, and use Undo. Classify again and create a rule with **Also file N uncategorized**. Repeat with an existing recipient rule and verify replacement is explicit. Check retry behavior after a failed request.
4. In Review, choose a suggestion or recent category, use **More…**, skip, and undo. Verify the remaining count and announcements. Confirm an ignore rule leaves existing entries visible.
5. Add a manual transaction, edit its amount, account, time, reference, remarks, and location, then delete it with confirmation. Compare Overview totals with the web dashboard after each mutation.
6. Check Android Back, keyboard dismissal, sheet dismissal, and large system fonts. Recipient and rule destinations open their implemented screens.

These screens use the Round 1 native dependencies. This change requires no native rebuild or configuration update.

## Recipients and rules

Recipients supports search by name, alias, or note; name, count, and total sorting; and inclusive minimum/maximum count and total filters. The list loads more pages while scrolling. Recipient detail shows payment stats, name and note editing (500 characters maximum), copyable aliases, and paginated transactions with the shared ledger actions. Adding an alias owned by another recipient asks before moving matching transactions or merging the source recipient.

**Apply category** uses the dominant category to file uncategorized transactions. It gathers all matching transaction IDs before changing categories, checks each entry again, and sends one category PATCH per transaction. Progress and partial failures are visible; retry gathers the remaining uncategorized entries. Classification and recipient changes invalidate the shared ledger queries so Transactions and Overview refresh.

Rules supports search, All/Enabled/Disabled/Needs repair filters, enabled toggles, and create/edit sheets. The form reuses the recipient picker, CategorySheet, and subcategory selector. Ignore applies only to future SMS imports. Conflicting enabled rules require confirmation before disabling the existing rule and saving the replacement; if saving fails after disabling, the form reports that partial result. Delete asks for confirmation and leaves existing transactions unchanged.

A `ruleUuid` route parameter opens the saved rule for editing. A `recipientUuid` parameter opens a new rule with that recipient selected. Recipient detail links to **Create rule** or **Open rule**; transaction detail's rule links open the same editor.

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

Expect setup on a fresh installation, or Overview when setup is complete. Reapply the reverse mapping after each reconnect.

## Connect to a backend

Overview reads `GET /api/dashboard/summary`, `GET /api/dashboard/spending-by-category`, and `GET /api/transactions` with a TrackCrow token kept in SecureStore.

Settings has an editable server URL, prefilled with `https://trackcrow.in`. **Sign in with Google** fetches the server's web client ID from `GET /api/mobile/auth/google`, opens the Credential Manager account picker, and exchanges the Google ID token at `POST /api/mobile/auth/google`. The server returns a token labelled `Android app` with `transactions:read`, `transactions:write`, and `sms:import`, and it appears in web Settings. The Google ID token is never stored. **Sign out** revokes that token on the server, clears the Google credential state, and removes local credentials. If the server cannot be reached, the app still signs out locally and says the token could not be revoked; revoke it from web Settings.

**Use an access token instead** is a fallback. Use a personal access token with `transactions:read`, `transactions:write`, and `sms:import` to edit the ledger and import SMS. A token without `transactions:write` can read the ledger but cannot classify, add, edit, delete, or create rules. Saving validates dashboard access with a one-row transactions request before storing anything. A token without SMS access makes import show **Sign in again** after the first 403 response.

### Automatic SMS import

The server supports the SMS import contract and issues Google app sessions with `sms:import`. Older sessions without that scope must sign in again.

Setup requests `RECEIVE_SMS` only after the SMS explainer and an explicit choice. A denial is remembered. Settings shows a compact import status and links to Diagnostics; run setup again to enable SMS import. Manual mode blocks foreground and headless imports even if permission is already granted. `READ_SMS` remains blocked, so only new arrivals are captured.

SMS parsing remains on the server. `src/common/sms-templates.ts` defines the banks, sender headers, and named parsing templates. To add or change a bank, edit that file and bump `SMS_CONFIG_VERSION`; deploy the server change. The app fetches `GET /api/mobile/config` on launch and after sign-in. Foreground fetches are throttled to once every four hours, including failed attempts, and use `If-None-Match` when a valid cached config has an ETag. Bank names in the cached config drive onboarding and coverage text.

`src/lib/sms-config.ts` validates schema version 1, bank metadata, and 1-9 character ASCII alphanumeric headers before calling `TrackCrowSms.setSenderConfig(json)`. Kotlin validates again and saves accepted JSON in private SharedPreferences. The receiver reads those preferences without JavaScript; a malformed fetch or native rejection preserves the working config. On restart the app restores its validated per-server cache before fetching. With no valid cache, the native matcher uses bundled `KOTAKB` and `HDFCBK` headers. It accepts optional two-letter operator prefixes and one-letter suffixes, such as `AD-HDFCBK-S`. It builds its own escaped matcher; the server sends no regex. This native change requires a new APK.

Before queueing a new arrival, the JavaScript importer checks sign-in, SMS permission, and setup mode, then applies a fixed local discard list. It drops any body containing one of these case-insensitive substrings: `otp`, `one time password`, `one-time password`, `verification code`, `security code`, `authentication code`, `do not share otp`, `do not share this code`, `never share otp`, `valid for`, `expires in`, `use this otp`, or `enter otp`. A transaction alert with one of these phrases in its footer is also discarded. All other messages from supported senders reach backend parsing; no transaction keywords are required on mobile.

The list is bundled in the app and is not server-configured. Matches are never added to the upload queue and emit only a fixed `sms.filter.discarded` diagnostic event. Existing queued messages are unchanged, and a discarded arrival can still trigger a drain of those pending messages. This JavaScript change uses the existing development client; distributing it requires a new release APK.

The native receiver accepts the configured bank sender headers and joins multipart SMS. It assigns a UUID before starting Headless JS. The task reads the saved token and posts this payload with Bearer authentication:

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

## Capture screenshots

`corepack pnpm screenshots:android` (from `mobile/`, Windows) drives the installed **TrackCrow Dev** through the main screens with [Maestro](https://docs.maestro.dev) and writes `01-overview.png` to `20-onboarding-sms.png` into `mobile/artifacts/screenshots/android/`. It runs the current checkout's JavaScript through Metro. It never runs prebuild, Gradle, or an install.

It needs the Maestro CLI 2.11 or newer installed natively on Windows (not WSL) with its `bin` folder on PATH, `JAVA_HOME` pointing to JDK 17 or newer, the SDK's adb, Docker, and both packages' dependencies installed. Prepare the phone: unlock it, use portrait orientation and default font and display size, and hide sensitive notifications. Pass `-Device <serial>` when more than one device is connected; the same serial goes to adb and Maestro, over USB or wireless debugging.

The command:

1. Checks the tools, the device, and that TrackCrow Dev is installed, and revokes its SMS permission.
2. Reuses the backend on port 3000 or starts this checkout's, starting the database container if needed.
3. Runs `pnpm db:screenshot-reset`. This replaces only the synthetic screenshot account from `prisma/screenshot-fixture.sql` and leaves other local data alone. Its access token is saved in the gitignored `.screenshot-token`.
4. Reuses Metro on port 8082 if it serves this checkout, or starts it with `APP_VARIANT=development`, then builds the bundle once so the app doesn't time out on a cold build.
5. Maps ports 3000 and 8082 with `adb reverse`, then restarts TrackCrow Dev on the explicit Metro URL.
6. Runs `mobile/.maestro/screenshots/capture.yaml`. It connects Settings to `http://127.0.0.1:3000` with the screenshot token, captures each screen without saving changes, and finally runs setup again in manual mode.

Afterwards TrackCrow Dev stays signed in to the local screenshot account with setup complete. Its previous session is replaced without being revoked; sign in again from Settings to use your own account. Metro and the backend keep running for the next capture, with logs in `mobile/artifacts/logs/`.

Flows select elements by visible text. Tabs and the Settings server URL and token fields have a `testID`, because their labels repeat elsewhere on screen. Each capture first waits for its screen's data, then for animations to end.

| Symptom | Recovery |
| --- | --- |
| `TrackCrow Dev ... is not installed` | Build and install it with the development client workflow above. The screenshot command never builds. |
| `Metro on port 8082 serves ...` | Metro is running for another checkout. Stop it, or run the command from that checkout. |
| `rejected the screenshot token` | The backend on port 3000 uses a different database. Point its `DATABASE_URL` at the local container. |
| Maestro fails on a step | The failing step's screenshot and view hierarchy are in `mobile/artifacts/maestro-run/`. Delete that folder afterwards; its logs can contain the local token. |
| A first-launch developer menu covers the app | Dismiss it once on the phone; the dev client remembers it. |

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

### Release 0.2.0 (4), 2026-10-02

Version 0.2.0 (versionCode 4) is the first Android release prepared for sharing with friends. It includes the app screens, onboarding, and Diagnostics through [PR #92](https://github.com/adhirajpandey/trackcrow/pull/92). The version bump is [PR #93](https://github.com/adhirajpandey/trackcrow/pull/93); the APK was built from commit `c0e19e2f16dd9219d3003cdd3273b3aa554e8560`.

The release build took 15 minutes 43 seconds end to end. APK verification confirmed package `app.trackcrow.mobile`, version `0.2.0 (4)`, and signing certificate SHA-1 `1B:30:9F:FB:F3:E4:02:D8:5B:2A:57:7B:48:F8:06:37:71:53:A1:14`. `RECEIVE_SMS` is present; `READ_SMS` and `RECORD_AUDIO` are absent. Native libraries include only `arm64-v8a` and `armeabi-v7a`. The APK is 64,262,229 bytes (61.29 MiB).

Supported banks are Kotak and HDFC. The owner confirmed that the release works on the phone after the installation and production-verification checklist was provided.

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

## Diagnostics upload contract

`POST /api/mobile/diagnostics` accepts a valid bearer token with any scope and stores a `report` or `bank_request` owned by that user. Reports carry app version, version code, device/queue JSON, an optional note, and up to 500 structured event objects. Bodies are capped at 256 KiB; both kinds share ten validated submissions per user per 24-hour window. See [the API reference](api.md#mobile-diagnostics) for the exact contract and errors.

This change provides server storage only. The diagnostics screen, event logger, redaction, report preview, and Send action remain for the later mobile diagnostics work. Those clients must redact events when written and upload only after an explicit Send action. The endpoint stores submitted JSON and does not log report contents. Apply the diagnostic-report migration before enabling report uploads. SMS import body retention is unchanged.
