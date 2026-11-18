"use client";

/**
 * TABLE KIT REFERENCE (route /full-screen/table). A layout reference, not a second game: it shows how a table-style
 * game (chips on a felt, one big action button, like Blackjack+ or Hoo Hee How on ape.church) builds its OWN console
 * from the kit's pieces instead of using KitSlotStage. The game lifecycle is the same as the slot example
 * (MyFullScreenGame.tsx); only the console differs.
 *
 * The pattern:
 * 1. Measure the stage box (ResizeObserver on the box, never `window`).
 * 2. Pick a layout: "phone" below 760 px wide or when portrait, else "desk". Phones get a different SHAPE (stacked
 *    console panel), not just a smaller desk.
 * 3. Fit a design-px stage into the box: scale = min(boxW / minW, boxH / baseH), then EXTEND it to fill the box
 *    (W = boxW / scale, H = boxH / scale), so nothing is letterboxed. Everything inside is laid out in design px.
 * 4. Put the console at the bottom (KitConsoleBar on desk, KitConsolePanel on phones), the corner pills on top
 *    (KitCorners), and the table in the room between them.
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import type { FrameControls } from "@/components/shared/immersive/frameControls";
import {
    KitBigButton,
    KitChipRack,
    KitConsoleBar,
    KitConsolePanel,
    KitCorners,
    KitNotice,
    KitPanel,
    KitPill,
    KitPlate,
    KitRoundButton,
    KitRoundButtons,
    KIT_ICONS,
    KIT_PILL_ICONS,
    kitChip,
} from "@/components/shared/immersive/kit/ChromeKit";
import { CHROME_KIT } from "@/components/shared/immersive/kit/kitArt";
import { DEMO_WALLET_BALANCE } from "../myFullScreenGameConfig";
import styles from "./table-kit.module.css";

// ── 1-3: layout in design px ──

type Mode = "desk" | "phone";
const LAYOUTS = {
    desk: { minW: 1600, baseH: 900, hudH: 130, cornerH: 80, pill: 15, consoleW: 1600 },
    phone: { minW: 380, baseH: 740, hudH: 236, cornerH: 46, pill: 11, consoleW: 380 },
} as const;
const pickMode = (w: number, h: number): Mode => (w < 760 || h > w * 1.15 ? "phone" : "desk");

// ── the demo table: one die, three bet zones ──

const ZONES = [
    { id: "low", label: "Low", sub: "1 to 3", pays: 1.9, wins: (d: number) => d <= 3 },
    { id: "six", label: "Six", sub: "exactly 6", pays: 5.5, wins: (d: number) => d === 6 },
    { id: "high", label: "High", sub: "4 to 6", pays: 1.9, wins: (d: number) => d >= 4 },
] as const;
type ZoneId = (typeof ZONES)[number]["id"];
const CHIPS = [1, 5, 10, 25, 100] as const;
const fmt = (n: number) => n.toLocaleString([], { maximumFractionDigits: 2 });

export default function TableKitExample({ frame }: { frame?: FrameControls }) {
    // 1. measure the box
    const boxRef = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState({ w: 1280, h: 720 });
    useLayoutEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const read = () => setBox({ w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) });
        read();
        const ro = new ResizeObserver(read);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // 2 + 3. pick the layout, fit + extend the design stage
    const mode = pickMode(box.w, box.h);
    const L = LAYOUTS[mode];
    const phone = mode === "phone";
    const scale = Math.min(box.w / L.minW, box.h / L.baseH);
    const W = box.w / scale;
    const H = box.h / scale;

    // ── game state (demo) ──
    const [balance, setBalance] = useState(DEMO_WALLET_BALANCE);
    const [chip, setChip] = useState<number>(1);
    const [bets, setBets] = useState<Record<ZoneId, number>>({ low: 0, six: 0, high: 0 });
    const [order, setOrder] = useState<{ zone: ZoneId; amount: number }[]>([]);
    const [die, setDie] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);
    const [lastWin, setLastWin] = useState<number | null>(null);
    const [rules, setRules] = useState(false);

    const total = bets.low + bets.six + bets.high;
    const short = total > balance;

    const place = (zone: ZoneId) => {
        if (rolling) return;
        setLastWin(null);
        setBets((b) => ({ ...b, [zone]: b[zone] + chip }));
        setOrder((o) => [...o, { zone, amount: chip }]);
    };
    const undo = () => {
        const last = order[order.length - 1];
        if (!last) return;
        setBets((b) => ({ ...b, [last.zone]: b[last.zone] - last.amount }));
        setOrder((o) => o.slice(0, -1));
    };
    const clear = () => {
        setBets({ low: 0, six: 0, high: 0 });
        setOrder([]);
    };
    const double = () => {
        setBets((b) => ({ low: b.low * 2, six: b.six * 2, high: b.high * 2 }));
        setOrder((o) => [...o, ...o]);
    };
    const roll = () => {
        if (!total || short || rolling) return;
        setRolling(true);
        setLastWin(null);
        // TODO: on ape.church, send the bets and wait for the VRF result
        setTimeout(() => {
            const d = 1 + Math.floor(Math.random() * 6);
            const win = ZONES.reduce((s, z) => s + (z.wins(d) ? bets[z.id] * z.pays : 0), 0);
            setDie(d);
            setBalance((b) => b - total + win);
            setLastWin(win);
            setRolling(false);
        }, 1100);
    };

    // ── the table area: between the corner pills and the console ──
    const tableTop = L.cornerH + (phone ? 10 : 20);
    const tableH = H - L.hudH - tableTop - (phone ? 16 : 70); // desk: the big button rises ~70 above the bar
    const zoneW = Math.min(phone ? (W - 40) / 3 : 300, (W - 80) / 3);
    const zoneH = Math.min(phone ? 150 : 210, tableH * 0.5);

    // ── 4. console pieces (design px) ──
    const balancePlate = <KitPlate phone={phone} label="Balance" value={{ value: fmt(balance), unit: "APE" }} />;
    const betPlate = <KitPlate phone={phone} label="Total bet" value={{ value: fmt(total), unit: "APE" }} bad={short} />;
    const rs = phone ? 46 : 58;
    const phoneRowH = L.hudH - 24 - 46 - 6;
    const phoneBig = Math.min(128, phoneRowH - 10);
    const rackW = phone ? Math.max(180, Math.min(W - 28 - phoneBig - 14, (phoneRowH - rs - 12) * CHROME_KIT.chipRack.aspect)) : 440;
    const rack = <KitChipRack values={CHIPS} selected={chip} onSelect={setChip} width={rackW} disabled={rolling} />;
    const small = (
        <>
            <KitRoundButton icon={KIT_ICONS.undo} label="Undo" size={rs} onClick={undo} disabled={rolling || !order.length} tip={!phone} />
            <KitRoundButton icon={KIT_ICONS.clear} label="Clear" size={rs} onClick={clear} disabled={rolling || !total} tip={!phone} />
            <KitRoundButton icon={KIT_ICONS.x2} label="Double" size={rs} onClick={double} disabled={rolling || !total || total * 2 > balance} tip={!phone} />
        </>
    );
    const big = (size: number, style?: React.CSSProperties) => (
        <KitBigButton label={rolling ? "Rolling" : "Roll"} size={size} onClick={roll} disabled={!total || short} busy={rolling} fontSize={phone ? 22 : 24} style={style} />
    );
    const consoleTop = H - L.hudH - (phone ? 6 : 12);

    return (
        <div ref={boxRef} className={styles.box}>
            <div className={styles.stage} style={{ width: W, height: H, transform: `scale(${scale})` }}>
                <div className={styles.room} aria-hidden />

                {/* the table */}
                <div className={styles.table} style={{ top: tableTop, height: tableH, gap: phone ? 14 : 28 }}>
                    <div className={`${styles.die} ${rolling ? styles.dieRolling : ""}`} style={{ width: phone ? 72 : 110, height: phone ? 72 : 110, fontSize: phone ? 40 : 62 }}>
                        {rolling ? "?" : die ?? "-"}
                    </div>
                    <div className={styles.zones} style={{ gap: phone ? 8 : 20 }}>
                        {ZONES.map((z) => {
                            const amt = bets[z.id];
                            const art = amt ? kitChip(chip) : undefined;
                            const hit = !rolling && die !== null && lastWin !== null && z.wins(die);
                            return (
                                <button
                                    key={z.id}
                                    type="button"
                                    className={`${styles.zone} ${hit ? styles.zoneHit : ""}`}
                                    style={{ width: zoneW, height: zoneH, fontSize: phone ? 15 : 26 }}
                                    onClick={() => place(z.id)}
                                    disabled={rolling}
                                    aria-label={`Bet ${chip} APE on ${z.label}`}
                                >
                                    <b>{z.label}</b>
                                    <small>{z.sub}</small>
                                    <em>pays {z.pays}x</em>
                                    {amt > 0 && (
                                        <span className={styles.stack} style={{ width: phone ? 34 : 54, height: phone ? 34 : 54, backgroundImage: art ? `url(${art.src})` : undefined }}>
                                            <i style={{ fontSize: phone ? 10 : 14 }}>{fmt(amt)}</i>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className={styles.result} style={{ fontSize: phone ? 16 : 24, minHeight: phone ? 20 : 30 }} aria-live="polite">
                        {lastWin !== null && (lastWin > 0 ? <span className={styles.win}>WIN {fmt(lastWin)} APE</span> : <span>No win</span>)}
                    </div>
                </div>

                {/* the console */}
                {phone ? (
                    <KitConsolePanel
                        top={consoleTop}
                        height={L.hudH}
                        style={{ left: 6, width: W - 12, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "46px 1fr", gap: "6px 8px", alignItems: "center" }}
                    >
                        <div style={{ gridColumn: 1, gridRow: 1, minWidth: 0 }}>{betPlate}</div>
                        <div style={{ gridColumn: 2, gridRow: 1, minWidth: 0 }}>{balancePlate}</div>
                        <div style={{ gridColumn: "1 / span 2", gridRow: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, height: "100%" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                {rack}
                                <KitRoundButtons style={{ width: rackW, justifyContent: "space-evenly" }}>{small}</KitRoundButtons>
                            </div>
                            {big(phoneBig)}
                        </div>
                    </KitConsolePanel>
                ) : (
                    <KitConsoleBar top={consoleTop} height={L.hudH} W={W} contentW={L.consoleW}>
                        {balancePlate}
                        {betPlate}
                        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>{rack}</div>
                        <KitRoundButtons gap={12}>{small}</KitRoundButtons>
                        {big(132, { marginTop: -30 })}
                    </KitConsoleBar>
                )}

                {/* a status chip just above the console */}
                {!rolling && (short || !total) && (
                    <KitNotice x={W / 2} y={consoleTop - (phone ? 22 : 40)} fontSize={phone ? 11 : 14}>
                        {short ? "Not enough APE for this bet" : "Pick a chip, then tap a zone to bet"}
                    </KitNotice>
                )}

                {/* corner pills: Menu + Games (left), your pills + History + Full screen (right) */}
                {frame && (
                    <KitCorners
                        controls={frame}
                        phone={phone}
                        fontSize={L.pill}
                        rightExtra={<KitPill label="Rules" icon={KIT_PILL_ICONS.info} onClick={() => setRules(true)} fontSize={L.pill} phone={phone} />}
                    />
                )}

                {rules && (
                    <KitPanel
                        title="Rules"
                        rows={ZONES.map((z) => [`${z.label} (${z.sub})`, `${z.pays}x`] as [string, string])}
                        note="One die per roll. Bets on every zone that matches the die pay out."
                        phone={phone}
                        W={W}
                        areaH={H - L.hudH}
                        onClose={() => setRules(false)}
                    />
                )}
            </div>
        </div>
    );
}
