"use client";

/**
 * Immersive (full-screen) game frame. DO NOT EDIT. See docs/FULL-SCREEN.md.
 * Every full-screen game on ape.church uses it (Blackjack+, Roulette, Hoo Hee
 * How, Dojo Drop, Reel Pirates...). A game opts in by rendering this frame and
 * importing ./immersive.css from its page.
 *
 * - The stage is exactly one viewport tall under NavTop (the site's top nav;
 *   MockSiteShell stands in for it in this template) (no HUD title bar, no
 *   window border, no backdrop image behind a box). The game draws edge to
 *   edge; history, leaderboard and the like go `below` the fold.
 * - The left sidebar slides out on demand (immersive.css + navDrawer).
 * - Short screens: the stage never gets shorter than `minHeight` (the page
 *   scrolls a little instead of the table shrinking), and browser full screen
 *   (useFullscreen) also hides NavTop.
 * - Ultrawide: the game is held to `maxAspect`; past it the sides show a
 *   blurred, darkened continuation of `backdrop` instead of stretched art.
 * - Paying with GP: put <KitGpSwitch> (kit/GpSwitch.tsx) on the console's
 *   balance readout, driven by useGpPayment (kit/useGpPayment.ts), and show
 *   the GP balance / GP cost there (gpPlates). Never float a <GpModePill> in a
 *   stage corner; it warns in development when rendered inside this frame.
 */

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./ImmersiveGameFrame.module.css";
import { setImmersiveNavOpen, useImmersiveNavOpen } from "./navDrawer";
import { ImmersiveStageContext } from "./immersiveContext";

export const IMMERSIVE_BELOW_ID = "game-below";

/** Scroll from the stage to the section under it (history, leaderboard). */
export function scrollToBelow() {
  document.getElementById(IMMERSIVE_BELOW_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ImmersiveGameFrame({
  children,
  below,
  backdrop,
  maxAspect = 2.4,
  minHeight = { desk: 480, phone: 440 },
}: {
  children: React.ReactNode;
  below?: React.ReactNode;
  /** Image continued (blurred, dark) into the side pillars on ultrawide screens. */
  backdrop?: string;
  /** Widest stage, width / height. */
  maxAspect?: number;
  minHeight?: { desk: number; phone: number };
}) {
  const navOpen = useImmersiveNavOpen();
  const pathname = usePathname();

  // The drawer closes on navigation, on Escape, and when the frame unmounts.
  useEffect(() => () => setImmersiveNavOpen(false), []);
  useEffect(() => setImmersiveNavOpen(false), [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setImmersiveNavOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [navOpen]);

  return (
    <div
      data-immersive-game
      className={styles.frame}
      style={
        {
          "--stage-min-desk": `${minHeight.desk}px`,
          "--stage-min-phone": `${minHeight.phone}px`,
          "--stage-max-aspect": maxAspect,
        } as React.CSSProperties
      }
    >
      <section className={styles.stage} data-immersive-stage>
        {backdrop && <div className={styles.pillars} style={{ backgroundImage: `url(${backdrop})` }} aria-hidden />}
        <div className={styles.stageInner}>
          <ImmersiveStageContext.Provider value={true}>{children}</ImmersiveStageContext.Provider>
        </div>
      </section>

      {below && (
        <div id={IMMERSIVE_BELOW_ID} className={styles.below}>
          {below}
        </div>
      )}

      {navOpen && <div className={styles.scrim} onClick={() => setImmersiveNavOpen(false)} aria-hidden />}
    </div>
  );
}
