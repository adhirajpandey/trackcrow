package app.trackcrow.sms

import org.junit.Assert.*
import org.junit.Test

class SmsSendersTest {
  private fun config(header: String = "NEWBANK", schema: String = "1"): String =
    """{"schemaVersion":$schema,"configVersion":"2","banks":[{"id":"NEW","name":"New Bank","senderHeaders":["$header"]}]}"""

  @Test fun acceptsOnlyPlainBoundedHeaders() {
    assertEquals(listOf("NEWBANK"), SmsSenders.headers(config()))
    for (header in listOf("", "TOOLONGHDR", "A.*", "AD-NEWBANK", " NEWBANK")) {
      assertNull(SmsSenders.headers(config(header)))
    }
    assertNull(SmsSenders.headers(config(schema = "2")))
    assertNull(SmsSenders.headers(config(schema = "\"1\"")))
    assertNull(SmsSenders.headers("{broken"))
    assertNull(SmsSenders.headers("""{"schemaVersion":1,"configVersion":"2","banks":[]}"""))
  }

  @Test fun buildsMatcherWithOptionalOperatorPrefixAndSuffix() {
    val matcher = SmsSenders.matcher(config())
    for (sender in listOf("NEWBANK", "AD-NEWBANK", "NEWBANK-S", "ad-newbank-s")) assertTrue(matcher.matches(sender))
    for (sender in listOf("KOTAKB", "HDFCBK", "X-NEWBANK", "ABC-NEWBANK", "AD-NEWBANK-SS", "NEWBANK.extra")) assertFalse(matcher.matches(sender))
  }

  @Test fun usesBundledDefaultsForAbsentOrInvalidCache() {
    for (cache in listOf(null, "{broken", config("A.*"))) {
      val matcher = SmsSenders.matcher(cache)
      for (sender in listOf("KOTAKB", "HDFCBK", "AD-KOTAKB", "VM-HDFCBK-S")) assertTrue(matcher.matches(sender))
      assertFalse(matcher.matches("AD-UNKNOWN"))
    }
  }
}
