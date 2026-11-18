"use client";

/**
 * The scene: everything the player looks at above the console. It fills the stage edge to edge (the background runs
 * under the console too) and lays itself out from the stage layout `L` the kit hands it:
 *
 * - `L.w` x `L.h`: the stage in screen px (NOT the viewport: never size anything with vw / vh here);
 * - `L.top` / `L.bottom`: px to keep clear for the corner pills (phones) and the console;
 * - `L.mode`: "desk" or "phone" (portrait or narrow), so the scene can change shape, not just scale;
 * - `L.bigTop` / `L.bigLeftFromRight`: where the big button rises above the console (desk), for scenery at the right.
 *
 * Keep it a pure function of props: the stage may re-render it at any size at any time (window resize, rotating a
 * phone, browser full screen), and must never remount it, so a running round survives a layout flip.
 */

import React, { useEffect, useRef, useState } from "react";
import useSound from "use-sound";
import { Banana, Cherry, Crown, Gem, Star, Zap } from "lucide-react";
import type { SlotStageLayout } from "@/components/shared/immersive/kit/SlotConsole";
import { usePlatformPrefs } from "@/components/shared/immersive/platform";
import { SYMBOLS } from "./myFullScreenGameConfig";
import styles from "./my-full-screen-game.module.css";

const ICONS = [Cherry, Banana, Star, Zap, Gem, Crown];

/** Gap between a reel stopping and the next one (ms). */
const STOP_STAGGER = 180;

export interface MyFullScreenGameSceneProps {
    L: SlotStageLayout;
    background: string;
    title: string;
    /** The last result, one symbol id per reel. */
    reels: readonly number[];
    /** A spin is waiting for its result: the reels turn. */
    spinning: boolean;
    /** The last spin's win multiplier (0 = no win), shown once the reels have stopped. */
    lastWinX: number;
}

export default function MyFullScreenGameScene({ L, background, title, reels, spinning, lastWinX }: MyFullScreenGameSceneProps) {
    const { muteSfx, sfxVolume } = usePlatformPrefs();
    const [winSfx] = useSound("/my-full-screen-game/sfx/win.mp3", { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true });
    const [loseSfx] = useSound("/my-full-screen-game/sfx/lose.mp3", { volume: sfxVolume, soundEnabled: !muteSfx, interrupt: true });

    // Reels stop left to right once the result is in. `stopped` = how many have stopped (3 = at rest). When a spin's
    // result lands (spinning true -> false) the count restarts at 0 (set during render, React's pattern for state
    // that follows a prop), then a timer stops one reel at a time.
    const [stopped, setStopped] = useState(3);
    const [prevSpinning, setPrevSpinning] = useState(spinning);
    if (spinning !== prevSpinning) {
        setPrevSpinning(spinning);
        if (!spinning) setStopped(0);
    }
    useEffect(() => {
        if (spinning || stopped >= 3) return;
        const t = setTimeout(() => setStopped((n) => n + 1), STOP_STAGGER);
        return () => clearTimeout(t);
    }, [spinning, stopped]);

    const atRest = stopped === 3 && !spinning;
    const won = atRest && lastWinX > 0;

    // one sound per spin, when the last reel lands
    const prevStopped = useRef(3);
    useEffect(() => {
        if (prevStopped.current < 3 && stopped === 3) (lastWinX > 0 ? winSfx : loseSfx)();
        prevStopped.current = stopped;
    }, [stopped, lastWinX, winSfx, loseSfx]);

    // ── layout, from L ──
    const phone = L.mode === "phone";
    const pad = phone ? 12 : 24;
    const areaTop = L.top + pad;
    const areaH = Math.max(80, L.h - L.bottom - areaTop - pad);
    const titleH = phone ? 28 : Math.min(56, areaH * 0.1);
    const cell = Math.max(48, Math.min((areaH - titleH * 2) * 0.62, (L.w - pad * 2) / (phone ? 3.5 : 4.2)));
    const gap = cell * 0.1;
    const machineW = cell * 3 + gap * 4;
    const machineH = cell + gap * 2;

    return (
        <div className={styles.scene}>
            <div className={styles.bg} style={{ backgroundImage: `url(${background})` }} aria-hidden />

            <div
                className={styles.area}
                style={{ top: areaTop, height: areaH, gap: titleH * 0.35 }}
            >
                <h1 className={styles.title} style={{ fontSize: titleH * 0.62 }}>{title}</h1>

                <div className={`${styles.machine} ${won ? styles.machineWin : ""}`} style={{ width: machineW, height: machineH, padding: gap, gap, borderRadius: gap * 1.6 }}>
                    {[0, 1, 2].map((i) => (
                        <Reel key={i} symbol={reels[i] ?? 0} spinning={spinning || i >= stopped} size={cell} radius={gap} />
                    ))}
                </div>

                <div className={styles.result} style={{ height: titleH, fontSize: titleH * 0.5 }} aria-live="polite">
                    {won && <span className={styles.win}>WIN {lastWinX}x</span>}
                </div>
            </div>
        </div>
    );
}

function Reel({ symbol, spinning, size, radius }: { symbol: number; spinning: boolean; size: number; radius: number }) {
    return (
        <div className={styles.reel} style={{ width: size, height: size, borderRadius: radius }}>
            {spinning ? (
                // a doubled strip scrolling by half its height loops seamlessly
                <div className={styles.strip}>
                    {[...SYMBOLS, ...SYMBOLS].map((s, i) => (
                        <SymbolTile key={i} id={s.id} size={size} />
                    ))}
                </div>
            ) : (
                <SymbolTile id={symbol} size={size} landed />
            )}
        </div>
    );
}

function SymbolTile({ id, size, landed = false }: { id: number; size: number; landed?: boolean }) {
    const Icon = ICONS[id] ?? Star;
    const color = SYMBOLS[id]?.color ?? "#fff";
    return (
        <div className={`${styles.tile} ${landed ? styles.tileLanded : ""}`} style={{ width: size, height: size }}>
            <Icon style={{ width: size * 0.56, height: size * 0.56, color, filter: `drop-shadow(0 0 ${size * 0.08}px ${color})` }} strokeWidth={2.2} aria-label={SYMBOLS[id]?.name} />
        </div>
    );
}
