import type { ConfigContext, ExpoConfig } from 'expo/config';

// APP_VARIANT=development builds TrackCrow Dev, a development client that installs beside the
// release app. Without it, the config is the production app defined in app.json.
const variant = process.env.APP_VARIANT || 'production';
if (variant !== 'production' && variant !== 'development') {
  throw new Error(`Unknown APP_VARIANT "${variant}". Use "development" or leave it unset.`);
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (variant === 'production') return base;
  return {
    ...base,
    name: 'TrackCrow Dev',
    scheme: 'trackcrow-dev',
    android: { ...base.android, package: 'app.trackcrow.mobile.dev' },
  };
};
