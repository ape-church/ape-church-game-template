"use client";

/**
 * The paytable, in the kit's 9-slice panel (KitPanel) over the stage. KitSlotStage renders `overlay` over the whole
 * stage in screen px, so this measures the stage itself to centre the panel above the console.
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import { KitPanel } from "@/components/shared/immersive/kit/ChromeKit";
import { PAIR_MULTIPLIER, SYMBOLS, TRIPLE_MULTIPLIER } from "../myFullScreenGameConfig";

export default function PaytableOverlay({ onClose }: { onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState<{ w: number; h: number } | null>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
        read();
        const ro = new ResizeObserver(read);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useLayoutEffect(() => {
        const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [onClose]);

    const phone = !!box && (box.w < 760 || box.h > box.w * 1.15);
    const rows: [string, string][] = [
        ...SYMBOLS.map((s, i) => [`3x ${s.name}`, `${TRIPLE_MULTIPLIER[i]}x`] as [string, string]).reverse(),
        ["Any pair", `${PAIR_MULTIPLIER}x`],
    ];

    return (
        <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 80 }}>
            {box && (
                <KitPanel
                    title="Paytable"
                    rows={rows}
                    note="Wins pay x your bet per spin. Demo math, about 94% RTP."
                    phone={phone}
                    W={box.w}
                    areaH={box.h * 0.8}
                    onClose={onClose}
                />
            )}
        </div>
    );
}
