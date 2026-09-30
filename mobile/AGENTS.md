# Android development

Read [the development setup](../docs/android.md) before running or troubleshooting the app. Follow the root repository conventions.

- Use the existing Expo SDK 57 development client and pnpm 10.28.2 lockfile. Preserve installed dependencies unless the task requires a change.
- Keep `node-linker=hoisted` in `.npmrc`. Use Corepack to invoke pnpm.
- Routes live in `src/app/`. Keep other code outside that directory.
- Match the web theme in `src/app/globals.css`; native colors live in `mobile/src/theme.ts`.
- Read the matching [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before changing Expo or React Native APIs.
- Configure native changes through `app.json` and config plugins. Do not hand-edit generated `android/` files.
- Run `corepack pnpm check` for mobile changes. Rebuild and verify on the device after native or app configuration changes.
- For a Pixel test APK on Windows, finish the code and mobile checks before building once with `corepack pnpm android:release:device`. This builds `arm64-v8a` only. Preserve the generated native output for incremental builds.
- Increase `android.versionCode` in `app.json` for every release APK. Release signing comes from Gradle properties outside the repository; see Build a release APK in the setup doc.
- Overview needs a backend. Settings signs in with Google (see Configure Google sign-in in the setup doc), or takes a token with `transactions:read` and `sms:import` as a fallback. Signed-in Android users are asked once for `RECEIVE_SMS`; `READ_SMS` remains blocked.
- SMS capture lives in `modules/trackcrow-sms/`, upload and queue logic in `src/lib/sms-import.ts`, and native adapters in `src/lib/sms-import-native.ts`. Never log SMS text or tokens. Sign-out must clear the queue.
- `src/lib/google-sign-in.ts` is the only file that imports the native Google sign-in module.
- Keep amounts, dates, and wording consistent with the web app: rupees with Indian grouping and no decimals, IST dates, and the section names from the web navigation.
