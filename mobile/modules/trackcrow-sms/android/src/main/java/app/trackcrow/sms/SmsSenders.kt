package app.trackcrow.sms

import android.content.Context
import org.json.JSONObject

object SmsSenders {
  private const val PREFERENCES = "trackcrow.smsConfig"
  private const val CONFIG_KEY = "config"
  private val defaultHeaders = listOf("KOTAKB", "HDFCBK")
  private val headerPattern = Regex("^[A-Za-z0-9]{1,9}$")

  internal fun headers(json: String): List<String>? = try {
    require(json.toByteArray(Charsets.UTF_8).size <= 65536)
    val config = JSONObject(json)
    require(config.get("schemaVersion") == 1)
    require(config.get("configVersion") is String && config.getString("configVersion").length in 1..64)
    val banks = config.getJSONArray("banks")
    require(banks.length() in 1..100)
    val ids = mutableSetOf<String>()
    val result = mutableListOf<String>()
    for (i in 0 until banks.length()) {
      val bank = banks.getJSONObject(i)
      require(bank.get("id") is String && bank.getString("id").length in 1..64)
      require(ids.add(bank.getString("id")))
      require(bank.get("name") is String && bank.getString("name").length in 1..100)
      val values = bank.getJSONArray("senderHeaders")
      require(values.length() in 1..50)
      for (j in 0 until values.length()) {
        require(values.get(j) is String)
        val value = values.getString(j)
        require(headerPattern.matches(value))
        result.add(value)
      }
    }
    require(result.size <= 500)
    result.distinct()
  } catch (_: Exception) { null }

  fun setConfig(context: Context, json: String): Boolean {
    if (headers(json) == null) return false
    return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
      .edit().putString(CONFIG_KEY, json).commit()
  }

  fun isAllowed(context: Context, sender: String): Boolean {
    val cached = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).getString(CONFIG_KEY, null)
    return matcher(cached).matches(sender)
  }

  internal fun matcher(json: String?): Regex {
    val values = json?.let { headers(it) } ?: defaultHeaders
    val alternatives = values.joinToString("|") { Regex.escape(it) }
    return Regex("^(?:[A-Z]{2}-)?(?:$alternatives)(?:-[A-Z])?$", RegexOption.IGNORE_CASE)
  }
}
