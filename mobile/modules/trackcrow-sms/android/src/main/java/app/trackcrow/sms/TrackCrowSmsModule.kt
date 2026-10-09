package app.trackcrow.sms

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

class TrackCrowSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TrackCrowSms")
    Function("setSenderConfig") { json: String ->
      appContext.reactContext?.let { SmsSenders.setConfig(it, json) } ?: false
    }
    // Bind messages to a server and session without storing its token in AsyncStorage.
    Function("sessionFingerprint") { apiUrl: String, token: String ->
      MessageDigest.getInstance("SHA-256").digest("$apiUrl\u0000$token".toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }
    AsyncFunction("lastLocation") { maxAgeMs: Double, timeoutMs: Double, promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction promise.resolve(null)
      PaymentLocation.read(context, maxAgeMs.toLong(), timeoutMs.toLong()) { promise.resolve(it) }
    }
  }
}
