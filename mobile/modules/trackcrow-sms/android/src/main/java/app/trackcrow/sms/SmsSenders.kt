package app.trackcrow.sms

object SmsSenders {
  // Keep aligned with the Kotak/HDFC debit parsers in src/common/sms-parser.ts.
  private val bankHeader = Regex("^(?:[A-Z]{2}-)?(?:KOTAKB|HDFCBK)(?:-[A-Z])?$", RegexOption.IGNORE_CASE)

  fun isAllowed(sender: String): Boolean = bankHeader.matches(sender)
}
