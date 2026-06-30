import type { KeyboardEvent, MouseEvent } from "react";

export function isInteractiveRowTarget(target: HTMLElement | null) {
  return Boolean(target?.closest("a, button, input, select, textarea"));
}

export function handleLinkRowClick(
  event: MouseEvent<HTMLElement>,
  href: string,
  navigate: (href: string) => void
) {
  if (isInteractiveRowTarget(event.target as HTMLElement | null)) {
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  navigate(href);
}

export function handleLinkRowKeyDown(
  event: KeyboardEvent<HTMLElement>,
  href: string,
  navigate: (href: string) => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    navigate(href);
  }
}
