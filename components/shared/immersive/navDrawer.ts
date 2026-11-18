"use client";

import { useSyncExternalStore } from "react";

/**
 * Open state of the slide-out sidebar while an immersive game is on the page.
 * The sidebar is the normal AppSidebar: immersive.css parks it off-canvas and
 * slides it back in while `<html data-immersive-nav="open">` is set. Module
 * state (no provider) so any control can open it (the game's corner Menu
 * button today; NavTop could too).
 */

let open = false;
const listeners = new Set<() => void>();

export function setImmersiveNavOpen(next: boolean) {
  if (open === next) return;
  open = next;
  if (typeof document !== "undefined") {
    if (next) document.documentElement.dataset.immersiveNav = "open";
    else delete document.documentElement.dataset.immersiveNav;
  }
  for (const l of [...listeners]) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useImmersiveNavOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}
