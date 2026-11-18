"use client";

/**
 * Paying with GP in an immersive game: the payment mode, the platform's rules
 * for when GP is offered, and what a bet costs in GP. Pair it with
 * <KitGpSwitch> on the console's balance readout (see GpSwitch.tsx) and
 * gpPlates() for the two readouts, instead of a floating <GpModePill>.
 *
 * The platform's rules (template build: the balance is DEMO_GP_BALANCE from ../platform):
 * - offered only with a wallet connected and at least MIN_GP_TO_SHOW_PAY_WITH_GP;
 * - falls back to APE by itself when the balance drops under that floor;
 * - the wager stays APE in state; GP cost = ceil(betApe x GP_PER_APE);
 * - on ape.church the game sends it with buildGameTransaction({ paymentMethod: gp.mode, ... }).
 */

import { useCallback, useEffect, useState } from "react";
import { DEMO_GP_BALANCE, GP_PER_APE, MIN_GP_TO_SHOW_PAY_WITH_GP, type PaymentMode } from "../platform";
import type { Money } from "./ChromeKit";

export interface GpPayment {
  mode: PaymentMode;
  setMode: (m: PaymentMode) => void;
  toggle: () => void;
  /** GP can be offered right now (wallet connected, enough GP, not demo). */
  available: boolean;
  /** GP is selected (and available). */
  active: boolean;
  /** GP balance (GP has 0 decimals). */
  balance: number;
  /** What `betApe` costs in GP. */
  costOf: (betApe: number) => number;
}

export function useGpPayment({ demo = false }: { demo?: boolean } = {}): GpPayment {
  // Template stand-in: on ape.church this is the connected wallet's GP balance (and `available` also needs a wallet).
  const gpBalance = DEMO_GP_BALANCE;
  const [mode, setMode] = useState<PaymentMode>("ape");
  const available = !demo && !(gpBalance < MIN_GP_TO_SHOW_PAY_WITH_GP);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- verbatim platform code
    if (mode === "gp" && !available) setMode("ape");
  }, [mode, available]);

  const toggle = useCallback(() => setMode((m) => (m === "gp" ? "ape" : "gp")), []);
  const costOf = useCallback((betApe: number) => Math.ceil(betApe * Number(GP_PER_APE)), []);

  return { mode, setMode, toggle, available, active: available && mode === "gp", balance: Number(gpBalance), costOf };
}

export const KIT_GP_COPY = {
  gpBalance: "GP BALANCE",
  gpCost: "GP COST",
  gpNotEnough: "NOT ENOUGH GP",
};

/** "12,345 GP" for a plate. */
export const gpMoney = (n: number): Money => ({ value: Math.round(n).toLocaleString(), unit: "GP" });

/**
 * The console's two readouts in GP mode, as KitPlate props: the GP balance
 * (lime) and what the bet costs in GP (lime, or red "NOT ENOUGH GP" when the
 * balance can't cover it; lock the play button on `short`).
 */
export function gpPlates(gp: Pick<GpPayment, "balance" | "costOf">, betApe: number, copy = KIT_GP_COPY) {
  const cost = gp.costOf(betApe);
  const short = cost > gp.balance;
  return {
    short,
    balance: { label: copy.gpBalance, value: gpMoney(gp.balance), accent: true },
    bet: { label: short ? copy.gpNotEnough : copy.gpCost, value: gpMoney(cost), accent: !short, bad: short },
  };
}
