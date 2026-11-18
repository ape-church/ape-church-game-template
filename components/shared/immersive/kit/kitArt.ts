/**
 * The chrome + lime HUD kit: Blackjack+'s console art, shared so every
 * full-screen game gets the same bottom console without new art. DO NOT EDIT.
 * The files live in public/shared/kit/; the slice figures below were measured
 * on them. To give your game its own console look, make a KitSkin (below) with
 * your own art in public/my-game/ instead of changing these.
 */

const P = "/shared/kit";

export const CHROME_KIT = {
  /** HUD-BAR: the console. The slate panel is 44.5% of the canvas height,
   *  centred at 51.1%; its rounded end caps are the outer 15% of the width. */
  bar: { src: `${P}/hud-bar-v1.webp`, w: 1536, h: 512, panelFrac: 0.445, panelCentre: 0.511, capFrac: 0.15 },
  /** CHIP-RACK: five cups, centres as % of the art (x, y). */
  chipRack: { src: `${P}/chip-rack-v1.webp`, aspect: 3, cups: [[15.8, 47], [32.9, 47], [50, 47], [67.1, 47], [84.2, 47]] as const },
  /** PLATE-VALUE: 9-slice readout, slice 22% top/bottom, 15% sides. */
  plate: `${P}/plate-v1.webp`,
  /** PANEL-MODAL: 9-slice panel (rules, payouts; the phone console), 12% slices. */
  panel: `${P}/panel-v1.webp`,
  roundButton: `${P}/btn-round-v1.webp`,
  /** The big round button (DEAL art, blank face: the label is code). */
  big: {
    idle: `${P}/btn-deal-v1.webp`,
    hover: `${P}/btn-deal-hover-v1.webp`,
    pressed: `${P}/btn-deal-pressed-v1.webp`,
    disabled: `${P}/btn-deal-disabled-v1.webp`,
  },
  /** Chip faces (value painted on). */
  chips: {
    1: `${P}/chip-1.png`,
    5: `${P}/chip-5.png`,
    10: `${P}/chip-10-red-v1.webp`,
    25: `${P}/chip-25.png`,
    100: `${P}/chip-100.png`,
    500: `${P}/chip-500-v1.webp`,
  } as Record<number, string>,
} as const;

/** CSS filter per chip value, for chip art that still clashes with another (none today). */
export const CHIP_TINT: Record<number, string | undefined> = {};

// ───────────────────────── skins ─────────────────────────

/**
 * A skin re-dresses every ChromeKit component (and the slot console, SlotConsole.tsx) with a game's own console
 * art and colours while the components, sizes and behaviour stay shared. Wrap a stage in
 * <KitSkinProvider skin={...}> (skin.tsx); with no provider the kit draws CHROME_SKIN, i.e. exactly Blackjack+'s
 * chrome + lime look, so games that never opt in are unchanged. Slice figures are measured on each skin's files.
 */
export type KitSkin = {
  /** 3-slice console bar: the panel is `panelFrac` of the art's height, centred at `panelCentre`; the end caps
   *  are the outer `capFrac` of its width; `w` x `h` is the file's size. */
  bar: { src: string; w: number; h: number; panelFrac: number; panelCentre: number; capFrac: number };
  /** 9-slice readout plate; `slice` is the CSS border-image-slice, `border` the drawn border widths (CSS) on a
   *  desk plate (76 design px tall) and a phone plate (46). */
  plate: { src: string; slice: string; border: { desk: string; phone: string } };
  /** 9-slice panel (phone console, rules); `slice` is the CSS border-image-slice; `consoleBorder` the drawn border
   *  (CSS) of KitConsolePanel; `modalBorder` KitPanel's border in px. */
  panel: { src: string; slice: string; consoleBorder: string; modalBorder: { desk: number; phone: number } };
  /** Small round button, drawn `contain`; the icon is code. */
  roundButton: string;
  /** The big round button's states. */
  big: { idle: string; hover: string; pressed: string; disabled: string };
  /** False when the big button's art carries its own icon: the label is then only the aria-label. */
  bigLabel: boolean;
  /** 3-slice pill button (spin presets, end actions); null draws a CSS pill in the skin's colours.
   *  `cap` = one rounded end's width / the art's height. */
  pill: { src: string; active: string; slice: string; cap: number } | null;
  /** Colours the kit's CSS reads (CSS custom properties; the chrome values are the CSS fallbacks). */
  colors: Partial<Record<KitColor, string>>;
  /** Opt-in: the slot console sits on the stage's bottom edge instead of floating above it. Desk: no lift under the
   *  bar (art below its face runs off the stage); phone: the panel spans the stage's width with no side or bottom
   *  margin. Absent / false keeps the kit's floating console, so skins that don't set it are unchanged. */
  flush?: boolean;
  /** Opt-in: the big button squashes slightly while held, on top of its pressed art (a physical press). */
  bigPress?: boolean;
  /** The share of the big button's diameter its label may span (default 0.72); a button whose lit face is smaller
   *  than its rim (a dome in a wide bezel) keeps its label on the face. */
  bigFace?: number;
  /** Opt-in: the phone console's label size (plate labels and the info line's labels), design px. Default 8.5 (about
   *  8 px on a 360 px phone); a skin may raise it where its plates have the room. */
  phoneLabel?: number;
};

export type KitColor =
  | "label" // plate labels, captions, tips
  | "value" // plate values
  | "valueGlow" // a text-shadow on plate values (a screen glow); none unless a skin sets it
  | "accent" // accent labels, panel titles, the selected pill
  | "bad" // a value the player can't afford
  | "win" // a win readout
  | "icon" // round-button icon strokes
  | "bigText" // the big button's label
  | "bigTextDisabled"
  | "pillBg" // CSS pills (corner pills; console pills without art)
  | "pillText"
  | "pillTextOn" // the label of a selected art pill (falls back to pillText)
  | "pillBorder"
  | "pillBorderHover"
  | "panelText";

/** The default skin: Blackjack+'s chrome + lime console (the values every kit component used before skins). */
export const CHROME_SKIN: KitSkin = {
  bar: CHROME_KIT.bar,
  plate: { src: CHROME_KIT.plate, slice: "22% 15%", border: { desk: "14px 26px", phone: "9px 14px" } },
  panel: { src: CHROME_KIT.panel, slice: "12%", consoleBorder: "14px 12px 10px", modalBorder: { desk: 30, phone: 20 } },
  roundButton: CHROME_KIT.roundButton,
  big: CHROME_KIT.big,
  bigLabel: true,
  pill: null,
  colors: {},
};
