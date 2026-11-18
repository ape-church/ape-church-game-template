"use client";

import { useMemo } from "react";
import { scrollToBelow } from "./ImmersiveGameFrame";
import { setImmersiveNavOpen } from "./navDrawer";
import { useFullscreen } from "./useFullscreen";

/**
 * What the immersive frame's corner buttons do. Each game draws them in its own
 * skin (Roulette's lacquer, Overtime Zombie's pixel plate, FrameCorners' chrome
 * pills), but the actions are always these.
 */
export type FrameControls = {
  /** Slides the site sidebar out. */
  onMenu: () => void;
  gamesHref: string;
  /** Scrolls to history + leaderboard under the stage. Absent when there is nothing below. */
  onHistory?: () => void;
  /** Absent where the browser has no Fullscreen API (iPhone Safari). */
  fullscreen?: { active: boolean; toggle: () => void };
};

/**
 * The standard FrameControls for a game in the immersive frame, or undefined
 * when `enabled` is false (the game's `?layout=hud` fallback). Entering full
 * screen scrolls the stage to the top of the page.
 */
export function useImmersiveFrameControls(enabled: boolean, opts?: { history?: boolean }): FrameControls | undefined {
  const fullscreen = useFullscreen((on) => {
    if (on) requestAnimationFrame(() => document.querySelector("[data-immersive-stage]")?.scrollIntoView({ block: "start" }));
  });
  const history = opts?.history ?? true;
  return useMemo(
    () =>
      enabled
        ? {
            onMenu: () => setImmersiveNavOpen(true),
            gamesHref: "/games",
            onHistory: history ? scrollToBelow : undefined,
            fullscreen: fullscreen.supported ? { active: fullscreen.active, toggle: fullscreen.toggle } : undefined,
          }
        : undefined,
    [enabled, history, fullscreen.supported, fullscreen.active, fullscreen.toggle],
  );
}
