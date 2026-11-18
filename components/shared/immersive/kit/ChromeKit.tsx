"use client";

/**
 * The chrome + lime HUD kit as components: the bottom console (one row on the
 * chrome bar on desktop, a 9-slice panel on phones), readout plates, the chip
 * rack, small round buttons, the big round button, the top-corner pills and a
 * rules panel. Everything is sized in design px and drawn inside a game's
 * scaled stage (the game owns the layout; these own the look). Same art and
 * proportions as Blackjack+'s PitDeck, so tables built on it match Blackjack.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./ChromeKit.module.css";
import { CHROME_KIT, CHIP_TINT } from "./kitArt";
import { useKitSkin } from "./skin";
import type { FrameControls } from "../frameControls";

export type Money = { value: string; unit: string };

/**
 * Font size for an amount so it never overflows its plate: full size up to
 * `fits` characters (value + unit), then scaled down.
 */
export function fitText(v: Money, base: number, fits: number, extra = 0) {
  const n = v.value.length + (v.unit ? v.unit.length * 0.6 + 0.5 : 0) + extra;
  return n > fits ? Math.max(base * 0.55, (base * fits) / n) : base;
}

// ───────────────────────── console ─────────────────────────

/**
 * Desktop console: the chrome bar art across the stage's full width, with a
 * content row held to the middle `contentW` design px (the room shows past it
 * on wide screens, the bar keeps going).
 */
export function KitConsoleBar({
  top,
  height,
  W,
  contentW,
  gap = 18,
  children,
}: {
  top: number;
  height: number;
  W: number;
  contentW: number;
  gap?: number;
  children: React.ReactNode;
}) {
  const bar = useKitSkin().bar;
  const artH = height / bar.panelFrac;
  const capW = bar.capFrac * bar.w * (artH / bar.h);
  const pad = Math.max(capW + 14, (W - contentW) / 2 + capW + 14);
  return (
    <>
      <div
        className={styles.consoleArt}
        style={{
          top: top + height / 2 - bar.panelCentre * artH,
          height: artH,
          borderWidth: `0 ${capW}px`,
          borderImage: `url(${bar.src}) 0 ${bar.capFrac * 100}% fill / 0 ${capW}px stretch`,
        }}
      />
      <div className={styles.console} style={{ top, height, display: "flex", alignItems: "center", gap, padding: `0 ${pad}px` }}>
        {children}
      </div>
    </>
  );
}

/** Phone console: a 9-slice panel at the bottom of the stage; the game lays out its rows inside. */
export function KitConsolePanel({ top, height, style, children }: { top: number; height: number; style?: React.CSSProperties; children: React.ReactNode }) {
  const panel = useKitSkin().panel;
  return (
    <div
      className={`${styles.console} ${styles.consolePanel}`}
      style={{
        top,
        height,
        borderWidth: panel.consoleBorder,
        borderImage: `url(${panel.src}) ${panel.slice} fill / ${panel.consoleBorder} stretch`,
        padding: "0 2px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ───────────────────────── readouts ─────────────────────────

export function KitPlate({
  label,
  value,
  phone,
  width,
  accent = false,
  bad = false,
  win = false,
  plateRef,
  labelRight,
  height,
  valueSize,
  icon,
}: {
  label: string;
  value: Money;
  phone: boolean;
  /** Override the plate height and the value's largest font size (design px), e.g. a phone console's main readout. */
  height?: number;
  valueSize?: number;
  /** Design px; phones default to filling their grid cell. */
  width?: number | string;
  /** Lime label (demo balance, GP mode). */
  accent?: boolean;
  /** Red value (can't afford it). */
  bad?: boolean;
  /** Win-coloured value (a payout). */
  win?: boolean;
  plateRef?: React.Ref<HTMLDivElement>;
  /** Small control at the right of the label row: the balance plate's <KitGpSwitch> (kit/GpSwitch.tsx). */
  labelRight?: React.ReactNode;
  /** Optional small icon before the value (e.g. a crate on a pulls counter). */
  icon?: React.ReactNode;
}) {
  const skin = useKitSkin();
  const plate = skin.plate;
  const b = phone ? plate.border.phone : plate.border.desk;
  const labelSize = phone ? skin.phoneLabel ?? 8.5 : 13;
  // `fits` is for the default 248 px desk plate: a narrower plate fits fewer characters, and an icon takes about 1.6
  // (a long value like "2 + 1 STD + PREM" beside a crate icon was cut to "P...")
  const fits = !phone && typeof width === "number" ? (11 * width) / 248 : phone ? 10 : 11;
  const vf = fitText(value, valueSize ?? (phone ? 16 : 26), fits, icon ? 1.6 : 0);
  return (
    <div
      ref={plateRef}
      className={`${styles.plate} ${accent ? styles.plateAccent : ""} ${bad ? styles.plateBad : ""} ${win ? styles.plateWin : ""}`}
      style={{
        // a plate carrying the GP switch gets room for it beside its label
        width: width ?? (phone ? "auto" : labelRight ? 276 : 248),
        flexShrink: 0,
        height: height ?? (phone ? 46 : 76),
        borderWidth: b,
        borderImage: `url(${plate.src}) ${plate.slice} fill / ${b} stretch`,
        padding: "0 6px",
      }}
    >
      {labelRight ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5em", minWidth: 0 }}>
          <span className={styles.plateK} style={{ fontSize: labelSize }}>{label}</span>
          {labelRight}
        </div>
      ) : (
        <div className={styles.plateK} style={{ fontSize: labelSize }}>{label}</div>
      )}
      <div className={`${styles.plateV} ${styles.num}`} style={{ fontSize: vf }}>
        {icon && <span className={styles.plateIcon} aria-hidden>{icon}</span>}
        {value.value}
        {value.unit && <small style={{ fontSize: Math.min(vf * 0.55, phone ? 9 : 14) }}>{value.unit}</small>}
      </div>
    </div>
  );
}

// ───────────────────────── chips ─────────────────────────

/** Chip art for a value, with its tint (see CHIP_TINT). Undefined for a value the kit has no art for. */
export function kitChip(value: number): { src: string; filter?: string } | undefined {
  const src = CHROME_KIT.chips[value];
  return src ? { src, filter: CHIP_TINT[value] } : undefined;
}

/** Five chips in the chrome rack's cups. */
export function KitChipRack({
  values,
  selected,
  onSelect,
  width,
  disabled,
  ariaLabel = (v) => `Chip ${v}`,
}: {
  values: readonly number[];
  selected: number;
  onSelect: (v: number) => void;
  width: number;
  disabled: boolean;
  ariaLabel?: (v: number) => string;
}) {
  const rack = CHROME_KIT.chipRack;
  const h = width / rack.aspect;
  const s = width * 0.14;
  return (
    <div className={styles.rack} style={{ width, height: h, backgroundImage: `url(${rack.src})` }}>
      {values.slice(0, 5).map((v, i) => {
        const [x, y] = rack.cups[i];
        const art = kitChip(v);
        const sel = v === selected;
        return (
          <button
            key={v}
            type="button"
            className={`${styles.rchip} ${sel ? styles.rchipSel : ""}`}
            style={{
              width: s,
              height: s,
              left: `calc(${x}% - ${s / 2}px)`,
              top: `calc(${y}% - ${s / 2}px)`,
              backgroundImage: art ? `url(${art.src})` : undefined,
              // the tint joins the rack's own drop shadows (a selected chip's glow is set in CSS)
              ...(art?.filter && !sel ? { filter: `${art.filter} drop-shadow(0 4px 4px rgba(0, 0, 0, 0.6))` } : {}),
              ...(art?.filter && sel
                ? { filter: `${art.filter} drop-shadow(0 0 10px rgba(140, 255, 0, 0.9)) drop-shadow(0 8px 6px rgba(0, 0, 0, 0.6))` }
                : {}),
            }}
            onClick={() => onSelect(v)}
            disabled={disabled}
            aria-label={ariaLabel(v)}
            aria-pressed={sel}
          />
        );
      })}
    </div>
  );
}

// ───────────────────────── buttons ─────────────────────────

export const KIT_ICONS = {
  undo: (
    <svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
  ),
  clear: (
    <svg viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></svg>
  ),
  x2: (
    <svg viewBox="0 0 24 24"><path d="M4 8l6 8M10 8l-6 8" /><path d="M14 9a3 3 0 1 1 5 2.2L14 16h6" /></svg>
  ),
  rebet: (
    <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>
  ),
} as const;

export function KitRoundButton({
  icon,
  label,
  size,
  onClick,
  disabled,
  tip,
}: {
  icon: React.ReactNode;
  label: string;
  size: number;
  onClick: () => void;
  disabled: boolean;
  /** Label under the button (desktop). */
  tip?: boolean;
}) {
  const roundButton = useKitSkin().roundButton;
  return (
    <button
      type="button"
      className={styles.rbtn}
      style={{ width: size, height: size, backgroundImage: `url(${roundButton})` }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {icon}
      {tip && <span className={styles.tip} style={{ fontSize: 11, bottom: -19 }}>{label}</span>}
    </button>
  );
}

export function KitRoundButtons({ gap, style, children }: { gap?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={styles.rbtns} style={{ gap, ...style }}>
      {children}
    </div>
  );
}

/** The big round button (the round's main action), with hover / pressed / disabled art. */
export function KitBigButton({
  label,
  size,
  onClick,
  disabled,
  busy = false,
  fontSize,
  style,
}: {
  label: string;
  size: number;
  onClick: () => void;
  disabled: boolean;
  busy?: boolean;
  fontSize: number;
  style?: React.CSSProperties;
}) {
  const skin = useKitSkin();
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  // While busy (a round waiting on its randomness) the button keeps its live art but takes no input at all: no
  // clicks, no keyboard, no focus (so no focus ring is left on it either).
  useEffect(() => {
    if (!busy) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- verbatim platform code
    setDown(false);
    ref.current?.blur();
  }, [busy]);
  const art = disabled ? skin.big.disabled : busy ? skin.big.idle : down ? skin.big.pressed : hover ? skin.big.hover : skin.big.idle;
  // The label fits the round face: long words (or a game's busy label such as "Crushing") shrink instead of
  // overflowing. Roughly 0.7 em a character for this heavy uppercase face, within ~72% of the diameter (skin.bigFace).
  const longest = Math.max(1, ...label.split("\n").map((l) => l.length));
  const fitSize = Math.min(fontSize, (size * (skin.bigFace ?? 0.72)) / (longest * 0.7));
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.big} ${busy ? styles.busy : ""} ${skin.bigPress && down && !disabled && !busy ? styles.bigDown : ""}`}
      style={{ width: size, height: size, ...style }}
      onClick={() => !disabled && !busy && onClick()}
      disabled={disabled}
      tabIndex={busy ? -1 : undefined}
      aria-disabled={busy || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setDown(false);
      }}
      onPointerDown={() => !busy && setDown(true)}
      onPointerUp={() => setDown(false)}
      aria-label={label}
      aria-busy={busy}
    >
      {/* The art is its own layer, so a busy console can turn the button's rim while the label stays upright. */}
      <i className={styles.bigArt} style={{ backgroundImage: `url(${art})` }} aria-hidden />
      {skin.bigLabel && <span style={{ fontSize: fitSize }}>{label}</span>}
    </button>
  );
}

// ───────────────────────── corners ─────────────────────────

export type KitCornerCopy = {
  menu: string;
  games: string;
  gamesAria: string;
  history: string;
  historyAria: string;
  fullscreen: string;
  exitFullscreen: string;
};

export const KIT_CORNER_COPY: KitCornerCopy = {
  menu: "Menu",
  games: "Games",
  gamesAria: "Back to all games",
  history: "History",
  historyAria: "History and leaderboard",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
};

/** A corner pill button (the GAMES link is drawn by KitCorners with the same class). */
export function KitPill({
  label,
  icon,
  text,
  onClick,
  off = false,
  disabled = false,
  fontSize,
  phone,
}: {
  label: string;
  icon: React.ReactNode;
  text?: string;
  onClick: () => void;
  /** Dims the icon (a muted sound toggle). */
  off?: boolean;
  /** Dims the pill and ignores clicks, but stays focusable so `label` still shows as its tooltip. */
  disabled?: boolean;
  fontSize: number;
  phone: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.pill} ${off ? styles.pillOff : ""} ${disabled ? styles.pillDisabled : ""}`}
      style={{ fontSize, padding: phone ? "5px 8px" : "9px 13px" }}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      aria-label={label}
      title={label}
    >
      {icon}
      {text}
    </button>
  );
}

export const KIT_PILL_ICONS = {
  menu: <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  back: <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>,
  info: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5v.5" /></svg>,
  sound: <svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>,
  soundOff: <svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m22 9-6 6M16 9l6 6" /></svg>,
  music: <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
  history: <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg>,
  fullscreen: <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
  exitFullscreen: <svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>,
} as const;

/**
 * The immersive frame's corner buttons in the chrome kit's pill skin, the same
 * as Blackjack+'s: Menu and GAMES top left (then `leftExtra`), `rightExtra`
 * then HISTORY and full screen top right. Phones drop Menu (NavTop has its
 * own), HISTORY, full screen and the labels.
 */
export function KitCorners({
  controls,
  phone,
  fontSize,
  leftExtra,
  rightExtra,
  games,
  copy = KIT_CORNER_COPY,
}: {
  controls: FrameControls;
  phone: boolean;
  fontSize: number;
  leftExtra?: React.ReactNode;
  /** Replaces the GAMES link (a page that opens its own games picker instead of leaving). */
  games?: React.ReactNode;
  rightExtra?: React.ReactNode;
  copy?: KitCornerCopy;
}) {
  const pad = phone ? "5px 8px" : "9px 13px";
  const side = phone ? 8 : 22;
  const top = phone ? 8 : 18;
  const gap = phone ? 5 : 10;
  return (
    <>
      {/* data-kit-hit: touch hit areas (ChromeKit.module.css), capped at the gap so neighbours never overlap */}
      <div className={styles.corner} data-kit-hit style={{ left: side, top, gap, "--kit-hit-x": `${gap}px` } as React.CSSProperties}>
        {!phone && <KitPill label={copy.menu} icon={KIT_PILL_ICONS.menu} onClick={controls.onMenu} fontSize={fontSize} phone={phone} />}
        {games ?? (
          <Link href={controls.gamesHref} className={styles.pill} style={{ fontSize, padding: pad }} aria-label={copy.gamesAria} title={copy.gamesAria}>
            {KIT_PILL_ICONS.back}
            {!phone && copy.games}
          </Link>
        )}
        {leftExtra}
      </div>
      <div className={styles.corner} data-kit-hit style={{ right: side, top, gap, "--kit-hit-x": `${gap}px` } as React.CSSProperties}>
        {rightExtra}
        {controls.onHistory && !phone && (
          <KitPill
            label={copy.historyAria}
            icon={KIT_PILL_ICONS.history}
            text={copy.history}
            onClick={controls.onHistory}
            fontSize={fontSize}
            phone={phone}
          />
        )}
        {controls.fullscreen && !phone && (
          <KitPill
            label={controls.fullscreen.active ? copy.exitFullscreen : copy.fullscreen}
            icon={controls.fullscreen.active ? KIT_PILL_ICONS.exitFullscreen : KIT_PILL_ICONS.fullscreen}
            onClick={controls.fullscreen.toggle}
            fontSize={fontSize}
            phone={phone}
          />
        )}
      </div>
    </>
  );
}

// ───────────────────────── panel ─────────────────────────

/** A centred 9-slice panel (rules, payouts) over a scrim, inside the stage. */
export function KitPanel({
  title,
  rows,
  note,
  phone,
  W,
  areaH,
  onClose,
}: {
  title: string;
  rows: [string, string][];
  note?: string;
  phone: boolean;
  W: number;
  /** Height of the area to centre in (the stage above the console). */
  areaH: number;
  onClose: () => void;
}) {
  const panel = useKitSkin().panel;
  const w = phone ? 340 : 600;
  const h = phone ? 380 : 500;
  const border = phone ? panel.modalBorder.phone : panel.modalBorder.desk;
  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div
        className={styles.panel}
        role="dialog"
        aria-label={title}
        style={{
          left: (W - w) / 2,
          top: Math.max(20, (areaH - h) / 2),
          width: w,
          maxHeight: h,
          fontSize: phone ? 12.5 : 19,
          borderWidth: border,
          borderImage: `url(${panel.src}) ${panel.slice} fill / ${border}px stretch`,
          padding: phone ? "0 2px" : "0 8px",
        }}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>{title}</h3>
        <table>
          <tbody>
            {rows.map(([a, b]) => (
              <tr key={a}>
                <td>{a}</td>
                <td className={styles.x}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {note && <p>{note}</p>}
      </div>
    </>
  );
}

/** A one-line status chip centred at (x, y) in the stage (e.g. "Not enough APE to play"). */
export function KitNotice({ x, y, fontSize, children }: { x: number; y: number; fontSize: number; children: React.ReactNode }) {
  return (
    <div className={styles.notice} style={{ left: x, top: y, fontSize }} role="status">
      {children}
    </div>
  );
}
