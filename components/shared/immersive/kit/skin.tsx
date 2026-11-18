"use client";

/**
 * The kit's skin context (see KitSkin in kitArt.ts). A game wraps its stage in <KitSkinProvider skin={...}> and every
 * ChromeKit / SlotConsole component under it draws that skin's art and colours. Without a provider the kit draws
 * CHROME_SKIN, so games that never opt in render exactly as before.
 */

import React, { createContext, useContext, useMemo } from "react";
import { CHROME_SKIN, type KitColor, type KitSkin } from "./kitArt";

const KitSkinContext = createContext<KitSkin>(CHROME_SKIN);

/** The skin the nearest KitSkinProvider supplies (CHROME_SKIN when there is none). */
export function useKitSkin(): KitSkin {
  return useContext(KitSkinContext);
}

/** CSS custom property per skin colour (ChromeKit.module.css reads them, with the chrome values as fallbacks). */
const VAR: Record<KitColor, string> = {
  label: "--kit-label",
  value: "--kit-value",
  valueGlow: "--kit-value-glow",
  accent: "--kit-accent",
  bad: "--kit-bad",
  win: "--kit-win",
  icon: "--kit-icon",
  bigText: "--kit-big-text",
  bigTextDisabled: "--kit-big-text-disabled",
  pillBg: "--kit-pill-bg",
  pillText: "--kit-pill-text",
  pillTextOn: "--kit-pill-text-on",
  pillBorder: "--kit-pill-border",
  pillBorderHover: "--kit-pill-border-hover",
  panelText: "--kit-panel-text",
};

/**
 * Supplies a skin to the kit components below it. The colours become CSS custom properties on a `display: contents`
 * wrapper, so it adds no box and changes no layout (custom properties still inherit through it).
 */
export function KitSkinProvider({ skin, children }: { skin: KitSkin; children: React.ReactNode }) {
  const vars = useMemo(() => {
    const v: Record<string, string> = {};
    for (const [k, value] of Object.entries(skin.colors)) if (value) v[VAR[k as KitColor]] = value;
    return v;
  }, [skin.colors]);
  return (
    <KitSkinContext.Provider value={skin}>
      {Object.keys(vars).length ? <div style={{ display: "contents", ...vars } as React.CSSProperties}>{children}</div> : children}
    </KitSkinContext.Provider>
  );
}
