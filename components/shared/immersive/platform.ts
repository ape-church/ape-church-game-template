"use client";

/**
 * TEMPLATE STAND-INS for the ape.church platform pieces the immersive frame and kit read. DO NOT EDIT.
 *
 * On ape.church these come from the app (UserPreferencesContext, the live APE price, the GP balance on chain). Here
 * they are small local versions with the SAME shape, so code written against them ports over with only its imports
 * changed. When your game is integrated, the Ape Church team swaps this file's imports for the real ones.
 *
 * - usePlatformPrefs(): music / sfx mute + volume and the APE / USD display toggle (one store for the whole page, so a
 *   corner pill and the game window agree).
 * - APE_PRICE_USD: a fixed demo price. Never do money math in USD: bet amounts are always held in APE in state.
 * - GP: the platform's second currency (Gimbo Points). GP_PER_APE and the "show Pay with GP" floor match ape.church.
 *   DEMO_GP_BALANCE stands in for the player's GP balance.
 */

import { useSyncExternalStore } from "react";

export type PaymentMode = "ape" | "gp";

export const APE_PRICE_USD = 0.65;

/** GP cost of 1 APE (GP has 0 decimals). */
export const GP_PER_APE = 2000;
/** The APE | GP switch only shows from this GP balance up. */
export const MIN_GP_TO_SHOW_PAY_WITH_GP = 2000;
/** Stand-in for the connected wallet's GP balance. */
export const DEMO_GP_BALANCE = 150_000;

export interface PlatformPrefs {
  muteMusic: boolean;
  musicVolume: number;
  muteSfx: boolean;
  sfxVolume: number;
  /** Show amounts in USD (display only; state stays APE). */
  usdMode: boolean;
}

let prefs: PlatformPrefs = { muteMusic: false, musicVolume: 0.5, muteSfx: false, sfxVolume: 0.5, usdMode: false };
const listeners = new Set<() => void>();

export function setPlatformPrefs(patch: Partial<PlatformPrefs>) {
  prefs = { ...prefs, ...patch };
  for (const l of [...listeners]) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const SERVER_PREFS = prefs;

/** The player's sound + display preferences, with setters (the same fields ape.church's useUserPreferences has). */
export function usePlatformPrefs() {
  const p = useSyncExternalStore(subscribe, () => prefs, () => SERVER_PREFS);
  return {
    ...p,
    setMuteMusic: (muteMusic: boolean) => setPlatformPrefs({ muteMusic }),
    setMuteSfx: (muteSfx: boolean) => setPlatformPrefs({ muteSfx }),
    setUsdMode: (usdMode: boolean) => setPlatformPrefs({ usdMode }),
  };
}
