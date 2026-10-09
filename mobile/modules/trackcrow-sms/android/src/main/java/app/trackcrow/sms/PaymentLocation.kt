package app.trackcrow.sms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/** Reads a recent or quick location as "lat,long". Never throws, logs, or waits past the timeout. */
object PaymentLocation {
  fun read(context: Context, maxAgeMs: Long, timeoutMs: Long, done: (String?) -> Unit) {
    val finished = AtomicBoolean(false)
    val finish = { value: String? -> if (finished.compareAndSet(false, true)) done(value) }
    try {
      if (!hasPermission(context)) return finish(null)
      val manager = context.getSystemService(LocationManager::class.java) ?: return finish(null)
      val providers = manager.getProviders(true)
      val now = SystemClock.elapsedRealtimeNanos()
      val recent = providers.mapNotNull { manager.getLastKnownLocation(it) }
        .filter { (now - it.elapsedRealtimeNanos) / 1_000_000 in 0..maxAgeMs }
        .maxByOrNull { it.elapsedRealtimeNanos }
      if (recent != null) return finish(format(recent))
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return finish(null)
      // Prefer the cheapest provider that gives a fix quickly.
      val provider = listOfNotNull(
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) LocationManager.FUSED_PROVIDER else null,
        LocationManager.NETWORK_PROVIDER,
        LocationManager.GPS_PROVIDER,
      ).firstOrNull { it in providers } ?: return finish(null)
      val signal = CancellationSignal()
      Handler(Looper.getMainLooper()).postDelayed({
        signal.cancel()
        finish(null)
      }, timeoutMs)
      manager.getCurrentLocation(provider, signal, context.mainExecutor) { location ->
        finish(location?.let(::format))
      }
    } catch (_: SecurityException) {
      finish(null)
    } catch (_: RuntimeException) {
      finish(null)
    }
  }

  private fun hasPermission(context: Context) = listOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION,
  ).any { context.checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

  private fun format(location: Location) =
    String.format(Locale.US, "%.6f,%.6f", location.latitude, location.longitude)
}
