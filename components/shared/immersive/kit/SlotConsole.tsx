"use client";

/**
 * A full-screen slot stage built from the kit: the game's scene edge to edge, the console along the bottom (the
 * skin's bar on desktop, its 9-slice panel on phones) with the per-spin bet, the spin count and the big button,
 * and the frame's corner pills. Every piece draws the nearest KitSkinProvider's skin (kitArt.ts), so a slot gets its
 * own console look without its own console code. The game passes data and callbacks (SlotConsoleData); the stage
 * owns layout and sizes.
 *
 * Sizes are design px: the console is laid out at a fixed design scale and fitted to the stage with one transform
 * (`k`), like the kit's other pieces. The scene gets the insets it must keep clear (SlotStageLayout).
 */

import React, { useLayoutEffect, useRef, useState } from "react";
import type { FrameControls } from "../frameControls";
import { KitBigButton, KitConsoleBar, KitConsolePanel, KitCorners, KitNotice, KitPlate, KitRoundButton, fitText, type Money } from "./ChromeKit";
import { useKitSkin } from "./skin";
import type { KitSkin } from "./kitArt";
import kit from "./ChromeKit.module.css";
import styles from "./SlotConsole.module.css";

// ───────────────────────── data ─────────────────────────

export interface SlotBetControl {
  /** The amount in the input's unit, as text (no unit). */
  text: string;
  /** "APE", "$" or "GP". */
  unit: string;
  onCommit: (text: string) => void;
  onHalf: () => void;
  onDouble: () => void;
  canHalf: boolean;
  canDouble: boolean;
  /** Under the plate on desktop (limits, totals). */
  caption?: string;
  /** Red value (can't afford it). */
  bad?: boolean;
  /** APE <-> USD; absent where the unit can't change (GP mode). */
  onToggleUnit?: () => void;
  /** The bet moves through fixed amounts (a game with set bet tiers): the round buttons read − / + ("Lower bet" /
   *  "Higher bet") instead of ½ / 2×, and onHalf / onDouble step one tier down / up. */
  steps?: boolean;
}

export interface SlotSpinsControl {
  value: number;
  min: number;
  max: number;
  presets: readonly number[];
  onChange: (spins: number) => void;
  caption?: string;
}

export interface SlotReadout {
  label: string;
  /** A shorter label for the phone console, where two plates share a row (e.g. "Bet" for "Bet per spin"). */
  phoneLabel?: string;
  value: Money;
  tone?: "win" | "bad" | "accent";
  /** Phones show one readout as the big plate (this one, else the first) and the rest on the info line above it. */
  primary?: boolean;
  /** Optional small icon before the value (plate and phone info line), e.g. a crate on a pulls counter. */
  icon?: React.ReactNode;
}

export interface SlotConsoleData {
  /** 0 setup, 1 playing, 2 finished. */
  view: 0 | 1 | 2;
  /** Inputs locked (a transaction in flight). */
  locked: boolean;
  bet: SlotBetControl;
  spins: SlotSpinsControl;
  /** Views 1 and 2: two or three plates. */
  readouts: SlotReadout[];
  big: { label: string; caption?: string; disabled: boolean; busy?: boolean; onClick: () => void };
  /** View 2 (and refunds): secondary actions (Rewatch, Change bet). */
  actions: { label: string; onClick: () => void; disabled?: boolean }[];
  /** Setup: the balance readout. Its `labelRight` carries <KitGpSwitch> (GpSwitch.tsx): GP is chosen on the
   *  balance plate, never by a floating pill. In GP mode show the GP balance here (gpPlates in useGpPayment.ts). */
  balance?: SlotReadout & { labelRight?: CornerExtra };
  /** Optional auto-spin toggle, beside the big button while playing (view 1 only: setup keeps its presets, the end
   *  screen its actions). The game runs the spins (it presses Spin for the player once each spin has played out);
   *  the console only shows the switch (the skin's pill, its selected art while on). */
  auto?: { on: boolean; onToggle: () => void; disabled?: boolean };
}

export interface SlotStageLayout {
  mode: "desk" | "phone";
  /** Stage size, px. */
  w: number;
  h: number;
  /** Px from the top the scene should keep clear (the corner row on phones). */
  top: number;
  /** Px from the bottom the scene should keep clear (the console). */
  bottom: number;
  /** Design scale of the console (px per design px). */
  k: number;
  /** Px from the bottom to the top of the big button where it rises above the console (desk; = bottom on phones),
   *  and the px from the right edge to its left side. Scenery standing at the right (a host) clears it. */
  bigTop: number;
  bigLeftFromRight: number;
}

export type SlotConsoleCopy = {
  bet: string;
  spins: string;
  half: string;
  double: string;
  lower: string;
  higher: string;
  fewer: string;
  more: string;
  unit: string;
  auto: string;
  autoLabel: string;
};

export const SLOT_CONSOLE_COPY: SlotConsoleCopy = {
  auto: "Auto",
  autoLabel: "Auto spin",
  bet: "Bet per spin",
  spins: "Spins",
  half: "Halve bet",
  double: "Double bet",
  lower: "Lower bet",
  higher: "Higher bet",
  fewer: "One spin fewer",
  more: "One spin more",
  unit: "Switch APE / USD",
};

export interface KitSlotStageProps {
  scene: (L: SlotStageLayout) => React.ReactNode;
  console: SlotConsoleData;
  frame?: FrameControls;
  /** Extra corner pills, top left (after GAMES) and top right (before HISTORY); a function gets `phone` so the
   *  pills can size themselves to the layout. */
  leftExtra?: CornerExtra;
  rightExtra?: CornerExtra;
  /** A one-line status chip above the console (setup only). */
  notice?: string;
  /** Over everything (paytable, rules). */
  overlay?: React.ReactNode;
  copy?: Partial<SlotConsoleCopy>;
}

export type CornerExtra = React.ReactNode | ((phone: boolean) => React.ReactNode);
const extra = (e: CornerExtra | undefined, phone: boolean) => (typeof e === "function" ? e(phone) : e);

/** Phone layout below this width, or whenever the stage is portrait. */
const PHONE_BELOW_W = 760;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const ICON = {
  minus: <svg viewBox="0 0 24 24"><path d="M6 12h12" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12" /></svg>,
  // two chasing arrows: repeat
  auto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 10.5a7.5 7.5 0 0 1 13.4-3.9M19.5 13.5a7.5 7.5 0 0 1-13.4 3.9" />
      <path d="M18.6 3.2v3.9h-3.9M5.4 20.8v-3.9h3.9" />
    </svg>
  ),
};

export default function KitSlotStage(props: KitSlotStageProps) {
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
  const phone = box.w < PHONE_BELOW_W || box.h > box.w * 1.15;
  const copy = { ...SLOT_CONSOLE_COPY, ...props.copy };
  const skin = useKitSkin();
  // The scene is rendered here, at one place in the tree for both layouts (as the HV-MTL forge's ForgeStage does): a
  // desk <-> phone flip (rotating a phone, resizing a window) must never remount the game's 3D world, which would
  // rebuild it and drop a running round. Same DOM as before: the scene layer first, then the console and pills.
  const L = phone ? phoneMetrics(props.console, box.w, box.h, skin).L : deskMetrics(props.console, copy, box.w, box.h, skin).L;
  return (
    <div ref={boxRef} className={styles.box}>
      <div className={styles.layer}>{props.scene(L)}</div>
      {phone ? <PhoneStage {...props} copy={copy} w={box.w} h={box.h} /> : <DeskStage {...props} copy={copy} w={box.w} h={box.h} />}
    </div>
  );
}

type StageProps = Omit<KitSlotStageProps, "copy"> & { copy: SlotConsoleCopy; w: number; h: number };

// ───────────────────────── desk ─────────────────────────

/**
 * Design px of the desk console: the bar's face (tall enough for a plate plus the caption under it), the room above
 * it the big button rises into, the gap that lifts the bar off the stage's bottom edge, and the band under the plates
 * kept for their captions at setup.
 */
const DESK = { consoleH: 120, rise: 72, lift: 12, captionRoom: 20, big: 150, contentW: 1500 };
/** One size for every round button and preset pill on the console; `gap*` between pieces (preset pills), `hug*`
 *  between a plate and the round buttons that step it (½ / 2×, − / +), which sit close to read as one control. */
const UNIT = { desk: 44, phone: 34, gapDesk: 10, gapPhone: 6, hugDesk: 5, hugPhone: 4 };
/** Height of the big button's caption line (when a game passes one). */
const CAPTION_H = 18;

/** Design px of the desk pieces, to work out what fits the bar (deskFit). */
const PIECE = { balance: 200, balanceGp: 250, bet: 2 * UNIT.desk + 2 * UNIT.hugDesk + 190, spinsControls: 2 * UNIT.desk + 2 * UNIT.hugDesk, preset: 54, readout0: 230, readout: 210, action: 128, auto: 96, autoIcon: 52 };
/**
 * Desk width of the spin-count plate: room for its label inside this skin's plate rims. A fixed 92 px left the chrome
 * plate (26 px rims a side) about 28 px of text, so "SPINS" showed as "S...". Label: 13 px, weight 800, uppercase,
 * 0.12em tracking, about 0.78 em a character.
 */
export function spinsPlateWidth(label: string, border: string) {
  const px = border.trim().split(/\s+/).map((v) => parseFloat(v) || 0);
  const sides = px.length >= 4 ? px[1] + px[3] : 2 * (px[1] ?? px[0] ?? 0);
  return Math.max(92, Math.ceil(sides + 12 + label.length * 13 * 0.78 + 4));
}

const ZONE_GAP = 22;
const RIGHT_GAP = 18;
/** Room kept free on the bar so pieces never touch. */
const FIT_SLACK = 24;

/**
 * What the desk console shows at this width. Pieces drop in order until the row fits the bar: first the spin presets
 * (5 / 10 / 15; − / + still set any count), then the auto toggle's word (icon only). If even that doesn't fit, the
 * whole console scales down (`k`) rather than letting controls overlap.
 */
function deskFit(c: SlotConsoleData, W: number, capPad: number, spinsW: number) {
  const inner = (width: number) => Math.min(width, DESK.contentW) - 2 * capPad;
  const auto = !!c.auto && c.view === 1;
  const need = (presets: boolean, autoIcon: boolean) => {
    const left = c.view === 0
      ? (c.balance ? (c.balance.labelRight ? PIECE.balanceGp : PIECE.balance) + 24 : 0) + PIECE.bet
      : c.readouts[0] ? PIECE.readout0 : 0;
    const n = c.spins.presets.length;
    const presetsW = presets && n ? 2 * UNIT.gapDesk - UNIT.hugDesk + n * PIECE.preset + (n - 1) * UNIT.gapDesk : 0;
    const others = Math.max(0, c.readouts.length - 1);
    const centre = c.view === 0 ? PIECE.spinsControls + spinsW + presetsW : others * PIECE.readout + Math.max(0, others - 1) * 14;
    const right = (c.actions.length ? PIECE.action + RIGHT_GAP : 0) + (auto ? (autoIcon ? PIECE.autoIcon : PIECE.auto) + RIGHT_GAP : 0) + DESK.big;
    return left + centre + right + 2 * ZONE_GAP + FIT_SLACK;
  };
  const tiers: [boolean, boolean][] = [[true, false], [false, false], [false, true]];
  for (const [presets, autoIcon] of tiers) {
    if (need(presets, autoIcon) <= inner(W)) return { presets, autoIcon, scale: 1 };
  }
  // nothing fits at this scale: keep the most compact set and shrink the console until it does
  const last = need(false, true);
  return { presets: false, autoIcon: true, scale: Math.min(1, W / (last + 2 * capPad)) };
}

/** The desk layout's sizes and the scene's layout (shared by KitSlotStage, which renders the scene, and DeskStage). */
function deskMetrics(c: SlotConsoleData, copy: SlotConsoleCopy, w: number, h: number, skin: KitSkin) {
  const bar = skin.bar;
  const spinsW = spinsPlateWidth(copy.spins, skin.plate.border.desk);
  // the end cap's width on the bar (design px), as KitConsoleBar draws it; its content row is padded by cap + 14
  const capW = bar.capFrac * bar.w * (DESK.consoleH / bar.panelFrac / bar.h);
  const k0 = clamp(h / 900, 0.6, 1.2);
  const fit = deskFit(c, w / k0, capW + 14, spinsW);
  const k = k0 * fit.scale;
  const W = w / k; // design width of the console layer
  // a flush skin (KitSkin.flush) drops the lift: the bar's face ends on the stage's bottom edge
  const lift = skin.flush ? 0 : DESK.lift;
  const layerH = DESK.rise + DESK.consoleH + lift;
  // at setup the plates sit a little high only when the game passes captions for them
  const padB = c.view === 0 && (!!c.bet.caption || !!c.spins.caption) ? DESK.captionRoom : 0;
  // the big button stands on the bar's face, its caption (if any) above the bottom rail
  const bigCaption = !!c.big.caption;
  const bigBottom = bigCaption ? 18 : 10;
  // the same right padding KitConsoleBar gives its content row, to report where the button sits
  const rightPad = Math.max(capW + 14, (W - DESK.contentW) / 2 + capW + 14);
  const L: SlotStageLayout = {
    mode: "desk",
    w,
    h,
    top: 0,
    k,
    bottom: Math.round((DESK.consoleH + lift + 6) * k),
    bigTop: Math.round((lift + bigBottom + DESK.big + (bigCaption ? CAPTION_H : 0)) * k),
    bigLeftFromRight: Math.round((rightPad + DESK.big) * k),
  };
  return { L, k, W, fit, spinsW, lift, layerH, padB, bigBottom };
}

function DeskStage(p: StageProps) {
  const { w, h } = p;
  const c = p.console;
  const { k, W, fit, spinsW, lift, layerH, padB, bigBottom } = deskMetrics(c, p.copy, w, h, useKitSkin());

  return (
    <>
      {/* data-kit-hit + --kit-k: touch hit areas of at least 44 screen px (ChromeKit.module.css; coarse pointers only) */}
      <div className={styles.consoleLayer} data-kit-hit style={{ width: W, height: layerH, transform: `scale(${k})`, "--kit-k": k } as React.CSSProperties}>
        <KitConsoleBar top={DESK.rise} height={DESK.consoleH} W={W} contentW={DESK.contentW} gap={ZONE_GAP}>
          {/* reading order, left to right: what you have (balance), what you bet, how many spins, then Spin */}
          {/* left keeps its natural width; the centre takes the rest, so the spins sit midway between the bet and the
              right group whatever drops out at narrower widths */}
          <div className={styles.zone} style={{ flex: "0 0 auto", justifyContent: "flex-start", gap: 24, paddingBottom: padB }}>
            {c.view === 0 ? (
              <>
                {c.balance && (
                  <KitPlate phone={false} width={c.balance.labelRight ? 250 : 200} {...plateProps(c.balance)} labelRight={extra(c.balance.labelRight, false)} />
                )}
                <BetControl c={c} copy={p.copy} phone={false} />
              </>
            ) : (
              c.readouts[0] && <KitPlate phone={false} width={230} {...plateProps(c.readouts[0])} />
            )}
          </div>
          {/* centre: the spins (setup) or the other readouts */}
          <div className={styles.zone} style={{ flex: 1, justifyContent: "center", gap: 14, paddingBottom: padB }}>
            {c.view === 0 ? (
              <SpinsControl c={c} copy={p.copy} phone={false} presets={fit.presets} plateWidth={spinsW} />
            ) : (
              c.readouts.slice(1).map((r) => <KitPlate key={r.label} phone={false} width={210} {...plateProps(r)} />)
            )}
          </div>
          {/* right: end-of-game actions, then the big button at the far right, rising above the bar */}
          <div className={styles.zone} style={{ flex: "0 0 auto", justifyContent: "flex-end", gap: RIGHT_GAP, paddingBottom: padB }}>
            {c.actions.length > 0 && (
              <div className={styles.actions} data-kit-hit-stack style={{ "--kit-hit-gap": "8px" } as React.CSSProperties}>
                {c.actions.map((a) => (
                  <KitPillButton key={a.label} h={38} onClick={a.onClick} disabled={a.disabled} style={{ fontSize: 13, minWidth: 128 }}>
                    {a.label}
                  </KitPillButton>
                ))}
              </div>
            )}
            {c.auto && c.view === 1 && <AutoToggle c={c} copy={p.copy} h={fit.autoIcon ? UNIT.desk : 38} fontSize={13} iconSize={fit.autoIcon ? 20 : 16} minWidth={fit.autoIcon ? PIECE.autoIcon : PIECE.auto} iconOnly={fit.autoIcon} />}
            <div style={{ position: "relative", width: DESK.big, height: "100%", flexShrink: 0 }}>
              <BigButton c={c} size={DESK.big} style={{ position: "absolute", left: 0, bottom: bigBottom - padB }} captionSize={13} />
            </div>
          </div>
        </KitConsoleBar>
      </div>

      {p.notice && c.view === 0 && <KitNotice x={w / 2} y={h - (DESK.consoleH + lift + 42) * k} fontSize={13 * k}>{p.notice}</KitNotice>}

      {p.frame && <KitCorners controls={p.frame} phone={false} fontSize={13 * clamp(k, 0.85, 1.1)} leftExtra={extra(p.leftExtra, false)} rightExtra={extra(p.rightExtra, false)} />}
      {p.overlay}
    </>
  );
}

// ───────────────────────── phone ─────────────────────────

/**
 * Design px of the phone console. One slim info line across the top of the panel (the balance and the GP switch at
 * setup; the secondary readouts and the auto toggle while playing), then the controls (or the main readout) beside
 * the big button. Kept short so the scene keeps most of the screen.
 */
const PHONE = { big: 92, side: 6, cornerH: 46, strip: 22, gap: 6, row: 46, mainH: 62, actionH: 30 };

/** The phone layout's sizes and the scene's layout (shared by KitSlotStage, which renders the scene, and PhoneStage). */
function phoneMetrics(c: SlotConsoleData, w: number, h: number, skin: KitSkin) {
  const k = clamp(w / 390, 0.82, 1.12);
  // a flush skin (KitSkin.flush) puts the panel edge to edge on the stage's bottom (no margin round it)
  const side = skin.flush ? 0 : PHONE.side;
  const W = (w - side * 2) / k;
  const border = parseFloat(skin.panel.consoleBorder) || 14;

  // the main readout gets the plate; the others ride on the info line
  const main = c.view === 0 ? undefined : c.readouts.find((r) => r.primary) ?? c.readouts[0];
  const stripItems = c.view === 0 ? (c.balance ? [c.balance] : []) : c.readouts.filter((r) => r !== main);
  // what sits at the info line's right: the balance's GP switch (setup) or the auto toggle (playing)
  const stripRightKind = c.view === 0 ? (extra(c.balance?.labelRight, true) ? "balance" : null) : c.auto && c.view === 1 ? "auto" : null;
  const hasStrip = stripItems.length > 0 || !!stripRightKind;

  const colH = c.view === 0
    ? PHONE.row * 2 + PHONE.gap
    : (main ? (c.actions.length ? PHONE.row : PHONE.mainH) : 0) + (c.actions.length ? PHONE.gap + PHONE.actionH : 0);
  const bigCaption = !!c.big.caption;
  const bigH = PHONE.big + (bigCaption ? 14 : 0);
  const rowH = Math.max(colH, bigH);
  const panelH = Math.round(border * 2 + (hasStrip ? PHONE.strip + PHONE.gap : 0) + rowH);
  const bottom = Math.round((panelH + side + 6) * k);
  const L: SlotStageLayout = { mode: "phone", w, h, top: Math.round(PHONE.cornerH * k), bottom, k, bigTop: bottom, bigLeftFromRight: 0 };
  return { L, k, side, W, main, stripItems, stripRightKind, hasStrip, rowH, panelH };
}

function PhoneStage(p: StageProps) {
  const { w, h } = p;
  const c = p.console;
  const { k, side, W, main, stripItems, stripRightKind, hasStrip, rowH, panelH } = phoneMetrics(c, w, h, useKitSkin());
  const stripRight = stripRightKind === "balance"
    ? extra(c.balance?.labelRight, true)
    : stripRightKind === "auto"
      ? <AutoToggle c={c} copy={p.copy} h={PHONE.strip} fontSize={9.5} iconSize={11} minWidth={62} />
      : null;

  return (
    <>
      <div
        className={styles.consoleLayer}
        data-kit-hit
        style={{ left: side, bottom: side, width: W, height: panelH, transform: `scale(${k})`, "--kit-k": k } as React.CSSProperties}
      >
        <KitConsolePanel top={0} height={panelH} style={{ left: 0, width: "100%" }}>
          <div className={styles.phoneBody}>
            {hasStrip && <PhoneStrip items={stripItems} right={stripRight} />}
            <div className={styles.phoneRow} style={{ height: rowH }}>
              <div className={styles.phoneCol}>
                {c.view === 0 ? (
                  <>
                    <BetControl c={c} copy={p.copy} phone />
                    <SpinsControl c={c} copy={p.copy} phone />
                  </>
                ) : (
                  <>
                    {main && <KitPlate phone width="100%" height={c.actions.length ? PHONE.row : PHONE.mainH} valueSize={c.actions.length ? 18 : 24} {...plateProps(main, true)} />}
                    {c.actions.length > 0 && (
                      <div style={{ display: "flex", gap: 6, "--kit-hit-x": "6px" } as React.CSSProperties}>
                        {c.actions.map((a) => (
                          <KitPillButton key={a.label} h={PHONE.actionH} onClick={a.onClick} disabled={a.disabled} style={{ flex: 1, fontSize: 10.5 }}>
                            {a.label}
                          </KitPillButton>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <BigButton c={c} size={PHONE.big} captionSize={9.5} />
            </div>
          </div>
        </KitConsolePanel>
      </div>

      {p.notice && c.view === 0 && <KitNotice x={w / 2} y={h - (panelH + side + 22) * k} fontSize={11 * k}>{p.notice}</KitNotice>}

      {p.frame && <KitCorners controls={p.frame} phone fontSize={11} leftExtra={extra(p.leftExtra, true)} rightExtra={extra(p.rightExtra, true)} />}
      {p.overlay}
    </>
  );
}

/** The phone console's info line: label / value pairs (no plates), and a small control at the right. */
function PhoneStrip({ items, right }: { items: SlotReadout[]; right?: React.ReactNode }) {
  // a skin's phoneLabel sizes these labels too (default: 0.72 of the 12.5 px line, as before)
  const labelSize = useKitSkin().phoneLabel;
  return (
    <div className={styles.strip} style={{ height: PHONE.strip }}>
      <div className={styles.stripItems}>
        {items.map((r) => (
          <span key={r.label} className={`${styles.stripItem} ${r.tone ? styles[`strip_${r.tone}`] : ""}`}>
            <em style={labelSize ? { fontSize: labelSize } : undefined}>{r.phoneLabel ?? r.label}</em>
            <b className={kit.num}>
              {r.icon && <span className={styles.stripIcon} aria-hidden>{r.icon}</span>}
              {r.value.value}
              {r.value.unit && <small>{r.value.unit}</small>}
            </b>
          </span>
        ))}
      </div>
      {right && <div className={styles.stripRight}>{right}</div>}
    </div>
  );
}

// ───────────────────────── pieces ─────────────────────────

function plateProps(r: SlotReadout, phone = false) {
  return { label: phone ? r.phoneLabel ?? r.label : r.label, value: r.value, accent: r.tone === "accent", bad: r.tone === "bad", win: r.tone === "win", icon: r.icon };
}

/**
 * The big button, with a caption under it only when the game passes one (a status such as "Connect wallet"). While
 * `busy` (a purchase waiting for its randomness) it spins in place and stays in its live art, instead of the game
 * greying the stage with a loading overlay; clicks are ignored until it settles.
 */
function BigButton({ c, size, style, captionSize }: { c: SlotConsoleData; size: number; style?: React.CSSProperties; captionSize: number }) {
  const caption = c.big.caption;
  const busy = !!c.big.busy;
  return (
    <div className={styles.bigWrap} style={{ width: size, ...style }}>
      <span className={busy ? styles.spinning : undefined} style={{ display: "block", width: size, height: size }}>
        <KitBigButton
          label={c.big.label}
          size={size}
          onClick={busy ? () => {} : c.big.onClick}
          disabled={busy ? false : c.big.disabled}
          busy={busy}
          fontSize={size * 0.15}
        />
      </span>
      {caption && (
        <span className={`${styles.bigCaption} ${c.big.disabled ? styles.dim : ""}`} style={{ fontSize: captionSize }}>
          {caption}
        </span>
      )}
    </div>
  );
}

/** The auto-spin switch: the skin's pill (its selected art while on) with a repeat icon. It stays usable while the
 *  reels turn so a player can stop the run mid-spin; `disabled` only for what the game says (e.g. a purchase in flight). */
function AutoToggle({ c, copy, h, fontSize, iconSize, minWidth, iconOnly }: { c: SlotConsoleData; copy: SlotConsoleCopy; h: number; fontSize: number; iconSize: number; minWidth: number; iconOnly?: boolean }) {
  const a = c.auto!;
  return (
    <KitPillButton h={h} on={a.on} onClick={a.onToggle} disabled={a.disabled} label={copy.autoLabel} style={{ fontSize, minWidth, gap: Math.round(h * 0.16) }}>
      <span className={`${styles.autoIcon} ${a.on ? styles.autoIconOn : ""}`} style={{ width: iconSize, height: iconSize }}>{ICON.auto}</span>
      {!iconOnly && copy.auto}
    </KitPillButton>
  );
}

/** The per-spin bet: ½, an editable plate (with the unit toggle), 2×. */
function BetControl({ c, copy, phone }: { c: SlotConsoleData; copy: SlotConsoleCopy; phone: boolean }) {
  const skin = useKitSkin();
  const plate = skin.plate;
  const bet = c.bet;
  const [draft, setDraft] = useState<string | null>(null);
  const r = phone ? UNIT.phone : UNIT.desk;
  const b = phone ? plate.border.phone : plate.border.desk;
  const value: Money = { value: draft ?? bet.text, unit: bet.unit };
  const commit = () => {
    if (draft !== null) bet.onCommit(draft);
    setDraft(null);
  };
  return (
    <div className={styles.control} style={{ gap: phone ? UNIT.hugPhone : UNIT.hugDesk, width: phone ? "100%" : undefined }}>
      <KitRoundButton icon={bet.steps ? ICON.minus : <span className={styles.roundText} style={{ fontSize: r * 0.38 }}>½</span>} label={bet.steps ? copy.lower : copy.half} size={r} onClick={bet.onHalf} disabled={c.locked || !bet.canHalf} />
      <div
        className={`${kit.plate} ${bet.bad ? kit.plateBad : ""} ${styles.betPlate}`}
        style={{
          width: phone ? undefined : 190,
          flex: phone ? 1 : undefined,
          height: phone ? 46 : 76,
          borderWidth: b,
          borderImage: `url(${plate.src}) ${plate.slice} fill / ${b} stretch`,
          padding: "0 6px",
        }}
      >
        <div className={kit.plateK} style={{ fontSize: phone ? skin.phoneLabel ?? 8.5 : 13 }}>{copy.bet}</div>
        <div className={`${kit.plateV} ${kit.num} ${styles.betRow}`} style={{ fontSize: fitText(value, phone ? 16 : 26, phone ? 10 : 11) }}>
          <input
            className={styles.input}
            inputMode="decimal"
            aria-label={copy.bet}
            style={{ width: inputWidth(value.value) }}
            value={value.value}
            disabled={c.locked}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setDraft(null);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          {bet.unit && (
            <button type="button" className={styles.unit} onClick={bet.onToggleUnit} disabled={!bet.onToggleUnit || c.locked} title={bet.onToggleUnit ? copy.unit : undefined}>
              {bet.unit}
            </button>
          )}
        </div>
        {!phone && bet.caption && <span className={styles.caption}>{bet.caption}</span>}
      </div>
      <KitRoundButton icon={bet.steps ? ICON.plus : <span className={styles.roundText} style={{ fontSize: r * 0.32 }}>2×</span>} label={bet.steps ? copy.higher : copy.double} size={r} onClick={bet.onDouble} disabled={c.locked || !bet.canDouble} />
    </div>
  );
}

/** The spin count: −, a plate, +, and (desktop) the preset pills. */
function SpinsControl({ c, copy, phone, presets, plateWidth = 92 }: { c: SlotConsoleData; copy: SlotConsoleCopy; phone: boolean; presets?: boolean; plateWidth?: number }) {
  const s = c.spins;
  const r = phone ? UNIT.phone : UNIT.desk;
  const gap = phone ? UNIT.gapPhone : UNIT.gapDesk;
  const hug = phone ? UNIT.hugPhone : UNIT.hugDesk;
  return (
    <div className={styles.control} style={{ gap: hug, width: phone ? "100%" : undefined }}>
      <KitRoundButton icon={ICON.minus} label={copy.fewer} size={r} onClick={() => s.onChange(s.value - 1)} disabled={c.locked || s.value <= s.min} />
      <div style={{ position: "relative", flex: phone ? 1 : undefined, minWidth: 0 }}>
        <KitPlate phone={phone} width={phone ? "100%" : plateWidth} label={copy.spins} value={{ value: String(s.value), unit: "" }} />
        {!phone && s.caption && <span className={styles.caption}>{s.caption}</span>}
      </div>
      <KitRoundButton icon={ICON.plus} label={copy.more} size={r} onClick={() => s.onChange(s.value + 1)} disabled={c.locked || s.value >= s.max} />
      {presets && (
        <div style={{ display: "flex", gap, marginLeft: gap * 2 - hug, "--kit-hit-x": `${gap}px` } as React.CSSProperties}>
          {s.presets.map((n) => (
            <KitPillButton key={n} h={r} on={s.value === n} onClick={() => s.onChange(n)} disabled={c.locked} style={{ fontSize: 15, minWidth: 54 }}>
              {n}
            </KitPillButton>
          ))}
        </div>
      )}
    </div>
  );
}

/** A 3-slice pill button in the skin's pill art (a CSS pill in the skin's colours when it has none). */
export function KitPillButton({
  h,
  on = false,
  onClick,
  disabled,
  label,
  style,
  children,
}: {
  h: number;
  on?: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const art = useKitSkin().pill;
  const cap = art ? Math.round(h * art.cap) : 0;
  const artStyle: React.CSSProperties = art
    ? {
        height: h,
        borderWidth: `0 ${cap}px`,
        borderStyle: "solid",
        borderColor: "transparent",
        borderImage: `url(${on ? art.active : art.src}) ${art.slice} fill / 0 ${cap}px stretch`,
        padding: `0 ${Math.max(0, h * 0.4 - cap)}px`,
      }
    : { height: h, padding: `0 ${h * 0.42}px` };
  return (
    <button
      type="button"
      className={`${styles.pillBtn} ${art ? "" : `${kit.pill} ${styles.pillCss}`} ${on ? styles.pillOn : ""}`}
      style={{ ...artStyle, ...style }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on || undefined}
      title={label}
    >
      {children}
    </button>
  );
}

/** The bet input's width for its text: digits are 1ch (tabular), separators about 0.35ch, so the unit sits right
 *  after the number. */
function inputWidth(text: string): string {
  let ch = 0;
  for (const c of text) ch += /[0-9]/.test(c) ? 1 : /[.,]/.test(c) ? 0.35 : 0.8;
  return `calc(${Math.max(1.5, ch).toFixed(2)}ch + 2px)`;
}
