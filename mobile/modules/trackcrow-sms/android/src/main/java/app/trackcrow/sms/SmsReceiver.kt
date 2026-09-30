package app.trackcrow.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.facebook.react.HeadlessJsTaskService
import java.util.UUID

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (parts.isEmpty()) return
    val sender = parts.first().originatingAddress ?: return
    if (!SmsSenders.isAllowed(context, sender) || parts.any { it.originatingAddress != sender }) return
    val service = Intent(context, SmsHeadlessTaskService::class.java)
      .putExtra("sender", sender)
      .putExtra("body", parts.joinToString("") { it.messageBody ?: "" })
      .putExtra("receivedAt", parts.first().timestampMillis)
      // Assign once at arrival; Android service redelivery and JS retries retain this UUID.
      .putExtra("idempotencyKey", UUID.randomUUID().toString())
    try {
      // SMS broadcasts temporarily allow background services.
      context.startService(service)
      HeadlessJsTaskService.acquireWakeLockNow(context)
    } catch (_: RuntimeException) {
      // Never log an SMS body, intent, or exception containing request data.
    }
  }
}
