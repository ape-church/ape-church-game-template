"use client";

/**
 * The full-screen stage: your scene edge to edge, the kit's slot console along the bottom (the bar on desktop, a
 * 9-slice panel on phones), and the frame's corner pills. This file only maps the game's state onto the console
 * (SlotConsoleData); the layout, sizes and pieces are the kit's (components/shared/immersive/kit/SlotConsole.tsx), so
 * the console matches every other full-screen game on ape.church.
 *
 * Reading order on the console: what you have (balance), what you bet, how many spins, then the big button.
 * - view 0 (setup): balance plate (with the APE | GP switch on it), bet per spin, spin count, big = "Buy spins".
 * - view 1 (playing): readouts (win so far, spins left, bet per spin), big = "Spin", optional auto toggle.
 * - view 2 (finished): readouts (balance, total bet, total payout), big = "Play again", actions Rewatch / Change bet.
 *
 * GP rule: GP is chosen on the balance plate (KitGpSwitch), never with a pill floating in a stage corner.
 */

import React, { useState } from "react";
import type { FrameControls } from "@/components/shared/immersive/frameControls";
import { KitPill, KIT_PILL_ICONS, type Money } from "@/components/shared/immersive/kit/ChromeKit";
import KitSlotStage, { type SlotConsoleData, type SlotStageLayout } from "@/components/shared/immersive/kit/SlotConsole";
import { KitSkinProvider } from "@/components/shared/immersive/kit/skin";
import KitGpSwitch from "@/components/shared/immersive/kit/GpSwitch";
import { gpPlates, type GpPayment } from "@/components/shared/immersive/kit/useGpPayment";
import { APE_PRICE_USD, usePlatformPrefs } from "@/components/shared/immersive/platform";
import { MAX_SPINS, MY_SKIN, SPIN_PRESETS } from "../myFullScreenGameConfig";
import PaytableOverlay from "./PaytableOverlay";

const fmt = (n: number, d = 3) => n.toLocaleString([], { minimumFractionDigits: 0, maximumFractionDigits: d });

export interface MyFullScreenGameStageProps {
    /** Corner pill actions (menu drawer, games link, history, full screen): useImmersiveFrameControls(). */
    frame?: FrameControls;
    scene: (L: SlotStageLayout) => React.ReactNode;
    currentView: 0 | 1 | 2;
    isLoading: boolean;
    isSpinning: boolean;
    /** Setup: bet per spin (APE) and spin count. */
    betPerSpin: number;
    setBetPerSpin: (ape: number) => void;
    minBet: number;
    maxBet: number;
    numberOfSpins: number;
    setNumberOfSpins: (n: number) => void;
    /** Playing / finished. */
    spinsLeft: number;
    payout: number | null;
    walletBalance: number;
    gp: GpPayment;
    autoSpin: boolean;
    onToggleAutoSpin: () => void;
    canPlayAgain: boolean;
    onPlay: () => void;
    onSpin: () => void;
    onPlayAgain: () => void;
    onRewatch: () => void;
    onReset: () => void;
}

export default function MyFullScreenGameStage(p: MyFullScreenGameStageProps) {
    const prefs = usePlatformPrefs();
    const [paytable, setPaytable] = useState(false);
    const view = p.currentView;

    // Money: state is always APE; USD is display only.
    const price = APE_PRICE_USD;
    const amount = (ape: number): Money =>
        prefs.usdMode ? { value: (ape * price).toFixed(2), unit: "USD" } : { value: fmt(ape), unit: "APE" };
    const inUnit = (ape: number) => (prefs.usdMode ? ape * price : ape);
    const toApe = (v: number) => (prefs.usdMode ? v / price : v);
    const setInput = (v: number) => {
        if (!Number.isFinite(v) || v <= 0) return;
        const ape = Math.min(Math.max(toApe(v), p.minBet), p.maxBet);
        p.setBetPerSpin(Math.round(ape * 100) / 100);
    };

    const totalBet = p.betPerSpin * p.numberOfSpins;
    const gpView = p.gp.active ? gpPlates(p.gp, totalBet) : null;
    const cantAfford = gpView ? gpView.short : totalBet > p.walletBalance;
    const won = (p.payout ?? 0) > 0;

    let big: SlotConsoleData["big"];
    let actions: SlotConsoleData["actions"] = [];
    let readouts: SlotConsoleData["readouts"] = [];
    if (view === 0) {
        big = { label: "Buy\nspins", disabled: cantAfford, busy: p.isLoading, onClick: p.onPlay };
    } else if (view === 1) {
        readouts = [
            { label: "Win", value: amount(p.payout ?? 0), tone: won ? "win" : undefined },
            { label: "Spins left", phoneLabel: "Spins", value: { value: `${p.spinsLeft} / ${p.numberOfSpins}`, unit: "" } },
            { label: "Bet per spin", phoneLabel: "Per spin", value: amount(p.betPerSpin) },
        ];
        big = {
            label: p.autoSpin && p.spinsLeft > 0 ? "Auto" : "Spin",
            // keep the live art while the reels turn; the game ignores a press until a spin can start
            disabled: p.autoSpin || p.spinsLeft <= 0,
            onClick: () => !p.isSpinning && p.onSpin(),
        };
    } else {
        readouts = [
            { label: "Balance", value: amount(p.walletBalance) },
            { label: "Total bet", phoneLabel: "Bet", value: amount(totalBet) },
            { label: "Total payout", phoneLabel: "Paid", primary: true, value: amount(p.payout ?? 0), tone: (p.payout ?? 0) > totalBet ? "win" : undefined },
        ];
        if (p.canPlayAgain) {
            big = { label: "Play\nagain", disabled: p.isLoading || cantAfford, busy: p.isLoading, onClick: p.onPlayAgain };
            actions = [
                { label: "Rewatch", onClick: p.onRewatch },
                { label: "Change bet", onClick: p.onReset },
            ];
        } else {
            big = { label: "Re\nwatch", disabled: false, onClick: p.onRewatch };
            actions = [{ label: "Change bet", onClick: p.onReset }];
        }
    }

    const gpSwitch = (phone: boolean) => (
        <KitGpSwitch mode={p.gp.mode} onToggle={p.gp.toggle} available={p.gp.available} disabled={p.isLoading} phone={phone} />
    );

    const data: SlotConsoleData = {
        view,
        locked: p.isLoading,
        bet: {
            text: inUnit(p.betPerSpin).toFixed(2),
            unit: prefs.usdMode ? "USD" : "APE",
            onCommit: (text) => setInput(parseFloat(text.replace(/[$,\s]/g, ""))),
            onHalf: () => setInput(inUnit(p.betPerSpin) / 2),
            onDouble: () => setInput(inUnit(p.betPerSpin) * 2),
            canHalf: !p.isLoading && p.betPerSpin > p.minBet + 1e-9,
            canDouble: !p.isLoading && p.betPerSpin < p.maxBet - 1e-9,
            bad: cantAfford,
            // the bet stays APE in state; in GP mode the caption shows what the whole session costs in GP
            caption: gpView ? `Cost ${gpView.bet.value.value} GP` : `Total ${fmt(inUnit(totalBet), 2)} ${prefs.usdMode ? "USD" : "APE"}`,
            // no unit toggle while paying with GP (the plate shows the GP cost instead)
            onToggleUnit: p.gp.active ? undefined : () => prefs.setUsdMode(!prefs.usdMode),
        },
        spins: {
            value: p.numberOfSpins,
            min: 1,
            max: MAX_SPINS,
            presets: SPIN_PRESETS,
            onChange: (n) => p.setNumberOfSpins(Math.max(1, Math.min(MAX_SPINS, n))),
        },
        readouts,
        big,
        actions,
        auto: { on: p.autoSpin, onToggle: p.onToggleAutoSpin },
        balance: gpView
            ? { label: gpView.balance.label, value: gpView.balance.value, tone: "accent", labelRight: gpSwitch }
            : { label: "Balance", value: amount(p.walletBalance), labelRight: p.gp.available ? gpSwitch : undefined },
    };

    const notice = view === 0 && !p.isLoading && cantAfford ? (gpView ? "Not enough GP for this bet" : "Not enough APE for this bet") : undefined;

    return (
        <KitSkinProvider skin={MY_SKIN}>
            <KitSlotStage
                scene={p.scene}
                console={data}
                frame={p.frame}
                notice={notice}
                // your game's own corner pills; the frame adds Menu + Games (left) and History + Full screen (right)
                rightExtra={(phone) => (
                    <>
                        <KitPill label="Paytable" icon={KIT_PILL_ICONS.info} onClick={() => setPaytable(true)} fontSize={phone ? 11 : 13} phone={phone} />
                        <KitPill
                            label="Sound effects"
                            icon={prefs.muteSfx ? KIT_PILL_ICONS.soundOff : KIT_PILL_ICONS.sound}
                            onClick={() => prefs.setMuteSfx(!prefs.muteSfx)}
                            fontSize={phone ? 11 : 13}
                            phone={phone}
                        />
                        {!phone && (
                            <KitPill label="Music" icon={KIT_PILL_ICONS.music} off={prefs.muteMusic} onClick={() => prefs.setMuteMusic(!prefs.muteMusic)} fontSize={13} phone={false} />
                        )}
                    </>
                )}
                overlay={paytable ? <PaytableOverlay onClose={() => setPaytable(false)} /> : undefined}
            />
        </KitSkinProvider>
    );
}
