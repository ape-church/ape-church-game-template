"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Browser full screen for the whole page (documentElement, not the game
 * element: dialogs and toasts portal to <body> and must stay visible). While
 * it is on, immersive.css also hides NavTop, so the game gets every pixel of
 * a laptop screen. `supported` is false on iPhone Safari, which has no
 * Fullscreen API for pages; hide the control there.
 */
export function useFullscreen(onChange?: (active: boolean) => void) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSupported(!!document.fullscreenEnabled);
    const sync = () => {
      const on = document.fullscreenElement === document.documentElement;
      setActive(on);
      onChange?.(on);
    };
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  return { supported, active, toggle };
}
