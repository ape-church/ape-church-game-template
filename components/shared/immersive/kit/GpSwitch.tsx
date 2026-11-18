"use client";

/**
 * The APE | GP switch for an immersive game's console. It sits on the balance
 * readout (KitPlate's `labelRight`), so "what am I paying with" and "how much
 * of it do I have" read together; never float a GP pill in a stage corner.
 * Renders nothing when GP can't be offered (pass `gp.available` from
 * useGpPayment), so a game can mount it unconditionally.
 *
 * The visible switch is small; its hit area is padded out to a comfortable
 * touch target. Its wallet side reads "USD" while the player shows amounts in
 * USD (usePlatformPrefs().usdMode), so no game has to pass it.
 */

import React from "react";
import { usePlatformPrefs, type PaymentMode } from "../platform";
import styles from "./GpSwitch.module.css";

export default function KitGpSwitch({
  mode,
  onToggle,
  available,
  disabled = false,
  phone = false,
}: {
  mode: PaymentMode;
  onToggle: () => void;
  available: boolean;
  /** Lock it while a hand / round is in play (GP is chosen before the bet). */
  disabled?: boolean;
  phone?: boolean;
}) {
  const { usdMode } = usePlatformPrefs();
  if (!available) return null;
  const gp = mode === "gp";
  const title = gp ? "Switch back to APE" : "Pay with GP instead";
  return (
    <button
      type="button"
      className={styles.gpSwitch}
      style={{ fontSize: phone ? 7.5 : 11 }}
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      aria-pressed={gp}
      aria-label={title}
      title={title}
    >
      <b className={!gp ? styles.on : ""}>{usdMode ? "USD" : "APE"}</b>
      <b className={gp ? styles.on : ""}>GP</b>
    </button>
  );
}
