const { AppRegistry } = require('react-native');

AppRegistry.registerHeadlessTask('TrackCrowSmsImport', () =>
  require('./src/lib/sms-import-native').handleIncomingSms,
);

require('expo-router/entry');
