from __future__ import annotations

import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"


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


BASE_URL = os.environ.get("TRACKCROW_UI_BASE_URL", "http://localhost:3000")
OUTPUT_DIR = ROOT_DIR / require_env("TRACKCROW_UI_IMAGE_OUTPUT_DIR")
CHROME_EXECUTABLE = Path(require_env("TRACKCROW_CHROME_EXECUTABLE"))
AUTOMATION_USER_DATA_DIR = Path(require_env("TRACKCROW_AUTOMATION_USER_DATA_DIR"))
SESSION_USER_EMAIL = require_env("TRACKCROW_AUTOMATION_SESSION_USER_EMAIL")
HEADLESS = env_flag("TRACKCROW_AUTOMATION_HEADLESS", False)
VIEWPORT_WIDTH = env_int("TRACKCROW_AUTOMATION_VIEWPORT_WIDTH", 1920)
VIEWPORT_HEIGHT = env_int("TRACKCROW_AUTOMATION_VIEWPORT_HEIGHT", 1080)
NAVIGATION_TIMEOUT_MS = env_int("TRACKCROW_AUTOMATION_NAVIGATION_TIMEOUT_MS", 30_000)
SCROLL_OVERLAP_PX = env_int("TRACKCROW_AUTOMATION_SCROLL_OVERLAP_PX", 140)
POST_SCROLL_SETTLE_MS = env_int("TRACKCROW_AUTOMATION_POST_SCROLL_SETTLE_MS", 400)
MAX_SCREENSHOTS_PER_PAGE = env_int("TRACKCROW_AUTOMATION_MAX_SCREENSHOTS_PER_PAGE", 20)
TRANSACTION_ID = env_int("TRACKCROW_AUTOMATION_TRANSACTION_ID", 4941)
RECIPIENT_ID = env_int("TRACKCROW_AUTOMATION_RECIPIENT_ID", 587)
CAPTURE_ALL_PAGES = env_flag("TRACKCROW_AUTOMATION_CAPTURE_ALL_PAGES", True)
TERMINATE_EXISTING_AUTOMATION_BROWSER = env_flag(
  "TRACKCROW_AUTOMATION_TERMINATE_EXISTING_BROWSER",
  True,
)
OPEN_HEADFUL_IN_FULL_DESKTOP_MODE = env_flag(
  "TRACKCROW_AUTOMATION_OPEN_HEADFUL_IN_FULL_DESKTOP_MODE",
  True,
)
PAGE_HEADINGS = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/recipients": "Recipients",
}


@dataclass(frozen=True)
class PageCapture:
  path: str
  base_name: str


POC_PAGES = [
  PageCapture(path="/dashboard", base_name="dashboard"),
]

ALL_PAGES = [
  *POC_PAGES,
  PageCapture(path="/transactions", base_name="transactions"),
  PageCapture(path="/recipients", base_name="recipients"),
  PageCapture(
    path=f"/transactions/{TRANSACTION_ID}",
    base_name=f"transaction-{TRANSACTION_ID}",
  ),
  PageCapture(
    path=f"/recipients/{RECIPIENT_ID}",
    base_name=f"recipient-{RECIPIENT_ID}",
  ),
]


def main() -> int:
  if not CHROME_EXECUTABLE.exists():
    print(f"Chrome executable not found: {CHROME_EXECUTABLE}", file=sys.stderr)
    return 1

  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
  AUTOMATION_USER_DATA_DIR.mkdir(parents=True, exist_ok=True)
  pages = ALL_PAGES if CAPTURE_ALL_PAGES else POC_PAGES
  session = build_session()

  try:
    with sync_playwright() as playwright:
      if TERMINATE_EXISTING_AUTOMATION_BROWSER:
        terminate_existing_automation_browser()

      context = playwright.chromium.launch_persistent_context(
        user_data_dir=str(AUTOMATION_USER_DATA_DIR),
        executable_path=str(CHROME_EXECUTABLE),
        headless=HEADLESS,
        viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
        no_viewport=OPEN_HEADFUL_IN_FULL_DESKTOP_MODE and not HEADLESS,
        args=["--start-maximized"] if OPEN_HEADFUL_IN_FULL_DESKTOP_MODE and not HEADLESS else None,
      )
      try:
        page = context.pages[0] if context.pages else context.new_page()
        page.bring_to_front()
        page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
        page.set_default_timeout(NAVIGATION_TIMEOUT_MS)
        context.add_cookies(
          [
            {
              "name": "next-auth.session-token",
              "value": session["token"],
              "url": BASE_URL,
              "httpOnly": True,
              "secure": False,
              "sameSite": "Lax",
            }
          ]
        )

        for page_capture in pages:
          capture_page(page, page_capture)
      finally:
        context.close()
  except PlaywrightError as error:
    print(f"Playwright error: {error}", file=sys.stderr)
    return 1
  except RuntimeError as error:
    print(str(error), file=sys.stderr)
    return 1

  return 0


def build_session() -> dict[str, str]:
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
    ["node", "-e", node_script, SESSION_USER_EMAIL],
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


def terminate_existing_automation_browser() -> None:
  user_data_dir = str(AUTOMATION_USER_DATA_DIR).replace("\\", "\\\\").replace("'", "''")
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


def capture_page(page, page_capture: PageCapture) -> None:
  url = f"{BASE_URL}{page_capture.path}"

  print(f"Capturing {url} -> {page_capture.base_name}-*.png")
  page.goto(url, wait_until="domcontentloaded")
  ensure_logged_in(page, url)
  wait_for_page_content(page, page_capture.path)
  clear_existing_indexed_outputs(page_capture.base_name)
  capture_scrolled_sequence(page, page_capture.base_name)


def ensure_logged_in(page, url: str) -> None:
  if "/login" in page.url.lower():
    raise RuntimeError(f"Navigation to {url} redirected to login.")


def wait_for_page_content(page, route_path: str) -> None:
  try:
    page.locator("main").first.wait_for(state="visible")
    heading = get_expected_heading(route_path)
    page.get_by_role("heading", name=heading).wait_for(state="visible")
  except PlaywrightTimeoutError as error:
    raise RuntimeError(f"Timed out waiting for page content on {page.url}") from error


def get_expected_heading(route_path: str) -> str:
  if route_path.startswith("/transactions/"):
    return "Transaction detail"

  if route_path.startswith("/recipients/"):
    return "Recipient detail"

  heading = PAGE_HEADINGS.get(route_path)
  if heading:
    return heading

  raise RuntimeError(f"No expected heading configured for route: {route_path}")


def clear_existing_indexed_outputs(base_name: str) -> None:
  for path in OUTPUT_DIR.glob(f"{base_name}-*.png"):
    path.unlink()


def capture_scrolled_sequence(page, base_name: str) -> None:
  screenshot_index = 0
  previous_scroll_y = -1

  while screenshot_index < MAX_SCREENSHOTS_PER_PAGE:
    output_path = OUTPUT_DIR / f"{base_name}-{screenshot_index}.png"
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

    scroll_step = max(1, viewport_height - SCROLL_OVERLAP_PX)
    next_scroll_y = min(max_scroll_y, scroll_y + scroll_step)

    if next_scroll_y <= scroll_y or next_scroll_y == previous_scroll_y:
      return

    previous_scroll_y = scroll_y
    page.evaluate("(nextY) => window.scrollTo(0, nextY)", next_scroll_y)
    page.wait_for_timeout(POST_SCROLL_SETTLE_MS)
    screenshot_index += 1

  raise RuntimeError(f"Exceeded screenshot guard for page base name: {base_name}")


if __name__ == "__main__":
  raise SystemExit(main())
