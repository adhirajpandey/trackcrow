"""
TrackCrow UI screenshot CLI.

Common commands:
  python scripts/screenshot_pages.py --list
  python scripts/screenshot_pages.py --pages recipient transaction --sizes mobile desktop
  python scripts/screenshot_pages.py --all --sizes desktop
  python scripts/screenshot_pages.py --all --sizes mobile --browser-mode headless
  python scripts/screenshot_pages.py --all --sizes mobile --browser-mode headfull
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

from playwright.sync_api import BrowserContext, Error as PlaywrightError
from playwright.sync_api import Page
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"

DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_DESKTOP_VIEWPORT = (1920, 1080)
DEFAULT_MOBILE_VIEWPORT = (390, 844)


def load_env_file(path: Path) -> None:
  if not path.exists():
    return

  for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue

    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip())


load_env_file(ENV_FILE)


def require_env(name: str) -> str:
  value = os.environ.get(name)
  if value is None or not value.strip():
    raise RuntimeError(f"Missing required environment variable: {name}")

  return value.strip()


def env_flag(name: str, default: bool) -> bool:
  value = os.environ.get(name)
  if value is None:
    return default

  return value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
  value = os.environ.get(name)
  if value is None or not value.strip():
    return default

  return int(value)


TRANSACTION_ID = env_int("TRACKCROW_AUTOMATION_TRANSACTION_ID", 4941)
RECIPIENT_ID = env_int("TRACKCROW_AUTOMATION_RECIPIENT_ID", 587)


@dataclass(frozen=True)
class ViewportPreset:
  alias: str
  width: int
  height: int


@dataclass(frozen=True)
class PageCapture:
  alias: str
  path: str
  output_slug: str
  heading: str
  click_target_name: str | None = None
  click_target_role: str = "link"
  clicked_output_slug: str | None = None
  clicked_heading: str | None = None
  clicked_wait_selector: str | None = None


@dataclass(frozen=True)
class RuntimeConfig:
  base_url: str
  output_dir: Path
  chrome_executable: Path
  automation_user_data_dir: Path
  session_user_email: str
  headless: bool
  navigation_timeout_ms: int
  scroll_overlap_px: int
  post_scroll_settle_ms: int
  max_screenshots_per_page: int
  terminate_existing_automation_browser: bool


@dataclass(frozen=True)
class CliOptions:
  pages: list[PageCapture]
  size_presets: list[ViewportPreset]
  headless: bool


VIEWPORT_PRESETS: dict[str, ViewportPreset] = {
  "desktop": ViewportPreset(
    alias="desktop",
    width=DEFAULT_DESKTOP_VIEWPORT[0],
    height=DEFAULT_DESKTOP_VIEWPORT[1],
  ),
  "mobile": ViewportPreset(
    alias="mobile",
    width=DEFAULT_MOBILE_VIEWPORT[0],
    height=DEFAULT_MOBILE_VIEWPORT[1],
  ),
}

PAGE_CAPTURES: dict[str, PageCapture] = {
  "landing": PageCapture(
    alias="landing",
    path="/",
    output_slug="landing",
    heading="Turn every payment alert into spending clarity.",
    click_target_name="See how it works",
    clicked_output_slug="landing-workflow",
    clicked_heading="The workflow",
    clicked_wait_selector="#workflow",
  ),
  "dashboard": PageCapture(
    alias="dashboard",
    path="/dashboard",
    output_slug="dashboard",
    heading="Dashboard",
  ),
  "transactions": PageCapture(
    alias="transactions",
    path="/transactions",
    output_slug="transactions",
    heading="Transactions",
  ),
  "recipients": PageCapture(
    alias="recipients",
    path="/recipients",
    output_slug="recipients",
    heading="Recipients",
  ),
  "transaction": PageCapture(
    alias="transaction",
    path=f"/transactions/{TRANSACTION_ID}",
    output_slug="transaction",
    heading="Transaction detail",
  ),
  "recipient": PageCapture(
    alias="recipient",
    path=f"/recipients/{RECIPIENT_ID}",
    output_slug="recipient",
    heading="Recipient detail",
  ),
}

DETAIL_PAGE_ENV_HINTS = {
  "transaction": "TRACKCROW_AUTOMATION_TRANSACTION_ID",
  "recipient": "TRACKCROW_AUTOMATION_RECIPIENT_ID",
}

CONFIG = RuntimeConfig(
  base_url=os.environ.get("TRACKCROW_UI_BASE_URL", DEFAULT_BASE_URL),
  output_dir=ROOT_DIR / require_env("TRACKCROW_UI_IMAGE_OUTPUT_DIR"),
  chrome_executable=Path(require_env("TRACKCROW_CHROME_EXECUTABLE")),
  automation_user_data_dir=Path(require_env("TRACKCROW_AUTOMATION_USER_DATA_DIR")),
  session_user_email=require_env("TRACKCROW_AUTOMATION_SESSION_USER_EMAIL"),
  headless=env_flag("TRACKCROW_AUTOMATION_HEADLESS", False),
  navigation_timeout_ms=env_int("TRACKCROW_AUTOMATION_NAVIGATION_TIMEOUT_MS", 30_000),
  scroll_overlap_px=env_int("TRACKCROW_AUTOMATION_SCROLL_OVERLAP_PX", 140),
  post_scroll_settle_ms=env_int("TRACKCROW_AUTOMATION_POST_SCROLL_SETTLE_MS", 400),
  max_screenshots_per_page=env_int("TRACKCROW_AUTOMATION_MAX_SCREENSHOTS_PER_PAGE", 20),
  terminate_existing_automation_browser=env_flag(
    "TRACKCROW_AUTOMATION_TERMINATE_EXISTING_BROWSER",
    True,
  ),
)


def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(
    description="Capture TrackCrow UI screenshots for selected pages and responsive sizes."
  )
  parser.add_argument(
    "--pages",
    nargs="+",
    metavar="PAGE",
    help="One or more page aliases to capture.",
  )
  parser.add_argument(
    "--sizes",
    nargs="+",
    metavar="SIZE",
    help="One or more size aliases to capture.",
  )
  parser.add_argument(
    "--all",
    action="store_true",
    help="Capture all available page aliases.",
  )
  parser.add_argument(
    "--list",
    action="store_true",
    help="Print the available page aliases and size presets.",
  )
  parser.add_argument(
    "--browser-mode",
    choices=("headless", "headful", "headfull"),
    help="Override browser visibility for this run.",
  )
  return parser


def main(argv: list[str] | None = None) -> int:
  parser = build_parser()
  args = parser.parse_args(argv)

  if args.list:
    print_available_options()
    return 0

  try:
    options = resolve_cli_options(parser, args, CONFIG)
  except ValueError as error:
    parser.error(str(error))

  if not CONFIG.chrome_executable.exists():
    print(f"Chrome executable not found: {CONFIG.chrome_executable}", file=sys.stderr)
    return 1

  ensure_runtime_directories(CONFIG)
  session = build_session(CONFIG)

  try:
    with sync_playwright() as playwright:
      if CONFIG.terminate_existing_automation_browser:
        terminate_existing_automation_browser(CONFIG)

      for size_preset in options.size_presets:
        capture_for_size(playwright.chromium, size_preset, options.pages, session, CONFIG, options.headless)
  except PlaywrightError as error:
    print(f"Playwright error: {error}", file=sys.stderr)
    return 1
  except RuntimeError as error:
    print(str(error), file=sys.stderr)
    return 1

  return 0


def validate_args(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
  if args.all and args.pages:
    parser.error("--all cannot be used together with --pages.")

  if not args.all and not args.pages:
    parser.error("one of --pages or --all is required unless --list is used.")

  if not args.sizes:
    parser.error("--sizes is required unless --list is used.")


def resolve_cli_options(
  parser: argparse.ArgumentParser,
  args: argparse.Namespace,
  config: RuntimeConfig,
) -> CliOptions:
  validate_args(parser, args)
  return CliOptions(
    pages=resolve_pages(args.pages, capture_all=args.all),
    size_presets=resolve_sizes(args.sizes),
    headless=resolve_headless_mode(args.browser_mode, config),
  )


def resolve_headless_mode(browser_mode: str | None, config: RuntimeConfig) -> bool:
  if browser_mode is None:
    return config.headless

  return browser_mode == "headless"


def ensure_runtime_directories(config: RuntimeConfig) -> None:
  config.output_dir.mkdir(parents=True, exist_ok=True)
  config.automation_user_data_dir.mkdir(parents=True, exist_ok=True)


def resolve_pages(page_aliases: Sequence[str] | None, *, capture_all: bool) -> list[PageCapture]:
  aliases = list(PAGE_CAPTURES) if capture_all else list(page_aliases or [])
  unknown_aliases = find_unknown_aliases(aliases, PAGE_CAPTURES)
  if unknown_aliases:
    raise ValueError(
      f"Unknown page alias(es): {', '.join(unknown_aliases)}. Use --list to see supported pages."
    )

  return [PAGE_CAPTURES[alias] for alias in aliases]


def resolve_sizes(size_aliases: Sequence[str]) -> list[ViewportPreset]:
  aliases = list(size_aliases)
  unknown_aliases = find_unknown_aliases(aliases, VIEWPORT_PRESETS)
  if unknown_aliases:
    raise ValueError(
      f"Unknown size alias(es): {', '.join(unknown_aliases)}. Use --list to see supported sizes."
    )

  return [VIEWPORT_PRESETS[alias] for alias in aliases]


def find_unknown_aliases(aliases: Sequence[str], registry: dict[str, object]) -> list[str]:
  return sorted({alias for alias in aliases if alias not in registry})


def print_available_options() -> None:
  print("Available pages:")
  for page_capture in PAGE_CAPTURES.values():
    detail_hint = DETAIL_PAGE_ENV_HINTS.get(page_capture.alias)
    detail_suffix = f" (uses {detail_hint})" if detail_hint else ""
    print(f"  - {page_capture.alias}: {page_capture.path}{detail_suffix}")

  print()
  print("Available sizes:")
  for preset in VIEWPORT_PRESETS.values():
    print(f"  - {preset.alias}: {preset.width}x{preset.height}")

  print()
  print("Available browser modes:")
  print("  - headless")
  print("  - headful")
  print("  - headfull")

  print()
  print("Use --all to capture every available page alias.")


def capture_for_size(
  chromium: Any,
  size_preset: ViewportPreset,
  pages: Sequence[PageCapture],
  session: dict[str, str],
  config: RuntimeConfig,
  headless: bool,
) -> None:
  context = chromium.launch_persistent_context(
    user_data_dir=str(config.automation_user_data_dir),
    executable_path=str(config.chrome_executable),
    headless=headless,
    viewport={"width": size_preset.width, "height": size_preset.height},
  )
  try:
    page = prepare_page(context, size_preset, session["token"], config)
    for page_capture in pages:
      capture_page(page, page_capture, size_preset, config)
  finally:
    context.close()


def prepare_page(
  context: BrowserContext,
  size_preset: ViewportPreset,
  session_token: str,
  config: RuntimeConfig,
) -> Page:
  page = context.pages[0] if context.pages else context.new_page()
  page.bring_to_front()
  page.set_default_navigation_timeout(config.navigation_timeout_ms)
  page.set_default_timeout(config.navigation_timeout_ms)
  page.set_viewport_size({"width": size_preset.width, "height": size_preset.height})
  context.add_cookies([build_session_cookie(session_token, config.base_url)])
  return page


def build_session_cookie(token: str, base_url: str) -> dict[str, str | bool]:
  return {
    "name": "next-auth.session-token",
    "value": token,
    "url": base_url,
    "httpOnly": True,
    "secure": False,
    "sameSite": "Lax",
  }


def build_session(config: RuntimeConfig) -> dict[str, str]:
  node_script = """
const dotenv = require('dotenv');
dotenv.config({ path: process.env.TRACKCROW_ENV_FILE });
const { encode } = require('next-auth/jwt');
const { PrismaClient } = require('./src/generated/prisma-rewrite');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.argv[1];
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        uuid: true,
        email: true,
        name: true,
        image: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new Error(`User not found for email: ${email}`);
    }

    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET,
      token: user,
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log(JSON.stringify({ token, email: user.email }));
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
""".strip()
  env = os.environ.copy()
  env["TRACKCROW_ENV_FILE"] = str(ENV_FILE)
  result = subprocess.run(
    ["node", "-e", node_script, config.session_user_email],
    check=True,
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    cwd=ROOT_DIR,
    env=env,
  )
  stdout_lines = [line for line in result.stdout.splitlines() if line.strip()]
  if not stdout_lines:
    raise RuntimeError("Failed to build NextAuth session token.")

  return json.loads(stdout_lines[-1])


def terminate_existing_automation_browser(config: RuntimeConfig) -> None:
  user_data_dir = str(config.automation_user_data_dir).replace("\\", "\\\\").replace("'", "''")
  command = f"""
(Get-CimInstance Win32_Process |
  Where-Object {{
    $_.Name -eq 'chrome.exe' -and
    $_.CommandLine -and
    $_.CommandLine -like '*--user-data-dir={user_data_dir}*'
  }} |
  Select-Object -ExpandProperty ProcessId)
""".strip()
  result = subprocess.run(
    ["powershell", "-NoProfile", "-Command", command],
    check=True,
    capture_output=True,
    text=True,
  )
  process_ids = [line.strip() for line in result.stdout.splitlines() if line.strip()]

  for process_id in process_ids:
    subprocess.run(
      ["taskkill", "/PID", process_id, "/T", "/F"],
      check=False,
      capture_output=True,
      text=True,
    )


def capture_page(
  page: Page,
  page_capture: PageCapture,
  size_preset: ViewportPreset,
  config: RuntimeConfig,
) -> None:
  url = f"{config.base_url}{page_capture.path}"
  base_name = build_output_base_name(page_capture, size_preset)

  print(f"Capturing {url} [{size_preset.alias}] -> {base_name}-*.png")
  page.goto(url, wait_until="domcontentloaded")
  ensure_logged_in(page, url)
  wait_for_page_content(page, page_capture.heading)
  reset_scroll_position(page, config)
  clear_existing_indexed_outputs(base_name, config)
  capture_scrolled_sequence(page, base_name, config)

  if page_capture.click_target_name and page_capture.clicked_output_slug and page_capture.clicked_heading:
    capture_clicked_page_state(page, page_capture, size_preset, config)


def ensure_logged_in(page: Page, url: str) -> None:
  if "/login" in page.url.lower():
    raise RuntimeError(f"Navigation to {url} redirected to login.")


def wait_for_page_content(page: Page, expected_heading: str) -> None:
  try:
    page.locator("main").first.wait_for(state="visible")
    page.get_by_role("heading", name=expected_heading).wait_for(state="visible")
  except PlaywrightTimeoutError as error:
    raise RuntimeError(f"Timed out waiting for page content on {page.url}") from error


def reset_scroll_position(page: Page, config: RuntimeConfig) -> None:
  page.evaluate("() => window.scrollTo(0, 0)")
  page.wait_for_timeout(config.post_scroll_settle_ms)


def build_output_base_name(page_capture: PageCapture, size_preset: ViewportPreset) -> str:
  return f"{size_preset.alias}-{page_capture.output_slug}"


def build_clicked_output_base_name(page_capture: PageCapture, size_preset: ViewportPreset) -> str:
  if not page_capture.clicked_output_slug:
    raise RuntimeError(f"Clicked output slug is not configured for page alias: {page_capture.alias}")

  return f"{size_preset.alias}-{page_capture.clicked_output_slug}"


def clear_existing_indexed_outputs(base_name: str, config: RuntimeConfig) -> None:
  for path in config.output_dir.glob(f"{base_name}-*.png"):
    path.unlink()


def capture_clicked_page_state(
  page: Page,
  page_capture: PageCapture,
  size_preset: ViewportPreset,
  config: RuntimeConfig,
) -> None:
  click_target_name = page_capture.click_target_name
  clicked_heading = page_capture.clicked_heading
  clicked_wait_selector = page_capture.clicked_wait_selector

  if not click_target_name or not clicked_heading:
    return

  clicked_base_name = build_clicked_output_base_name(page_capture, size_preset)
  print(f"Capturing clicked state [{size_preset.alias}] -> {clicked_base_name}-*.png")

  page.get_by_role(page_capture.click_target_role, name=click_target_name).first.click()
  page.wait_for_function("() => window.location.hash === '#workflow'")
  if clicked_wait_selector:
    page.locator(clicked_wait_selector).wait_for(state="visible")
  else:
    wait_for_page_content(page, clicked_heading)
  page.wait_for_timeout(config.post_scroll_settle_ms)

  clear_existing_indexed_outputs(clicked_base_name, config)
  capture_scrolled_sequence(page, clicked_base_name, config)


def capture_scrolled_sequence(page: Page, base_name: str, config: RuntimeConfig) -> None:
  screenshot_index = 0
  previous_scroll_y = -1

  while screenshot_index < config.max_screenshots_per_page:
    output_path = config.output_dir / f"{base_name}-{screenshot_index + 1:02d}.png"
    page.screenshot(path=str(output_path), full_page=False)

    metrics = page.evaluate(
      """
      () => ({
        scrollY: Math.round(window.scrollY),
        viewportHeight: Math.round(window.innerHeight),
        scrollHeight: Math.round(document.documentElement.scrollHeight),
      })
      """
    )

    scroll_y = metrics["scrollY"]
    viewport_height = metrics["viewportHeight"]
    scroll_height = metrics["scrollHeight"]
    max_scroll_y = max(0, scroll_height - viewport_height)

    if scroll_y >= max_scroll_y:
      return

    scroll_step = max(1, viewport_height - config.scroll_overlap_px)
    next_scroll_y = min(max_scroll_y, scroll_y + scroll_step)

    if next_scroll_y <= scroll_y or next_scroll_y == previous_scroll_y:
      return

    previous_scroll_y = scroll_y
    page.evaluate("(nextY) => window.scrollTo(0, nextY)", next_scroll_y)
    page.wait_for_timeout(config.post_scroll_settle_ms)
    screenshot_index += 1

  raise RuntimeError(f"Exceeded screenshot guard for page base name: {base_name}")


if __name__ == "__main__":
  raise SystemExit(main())
