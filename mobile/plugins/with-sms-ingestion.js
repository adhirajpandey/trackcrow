const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withSmsIngestion(config) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application[0];
    const receiverName = 'app.trackcrow.sms.SmsReceiver';
    const serviceName = 'app.trackcrow.sms.SmsHeadlessTaskService';
    application.receiver = (application.receiver || []).filter((entry) => entry.$['android:name'] !== receiverName);
    application.receiver.push({
      $: { 'android:name': receiverName, 'android:exported': 'true', 'android:permission': 'android.permission.BROADCAST_SMS' },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }] }],
    });
    application.service = (application.service || []).filter((entry) => entry.$['android:name'] !== serviceName);
    application.service.push({ $: { 'android:name': serviceName, 'android:exported': 'false' } });
    return result;
  });
};
