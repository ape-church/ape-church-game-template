import { Game, PayoutStructure } from "@/lib/games";
import { CHROME_SKIN, type KitSkin } from "@/components/shared/immersive/kit/kitArt";

/**
 * The full-screen example: a 3-reel slot sold as a session (bet per spin x spins), the same game as the HUD example in
 * components/my-game, so you can compare the two layouts line by line. See docs/FULL-SCREEN.md.
 */

// ── symbols + payouts ──

/** Reel symbols, lowest to highest. The scene draws them (MyFullScreenGameScene.tsx); swap in your own art. */
export const SYMBOLS = [
    { id: 0, name: "Cherry", color: "#ff5d73" },
    { id: 1, name: "Banana", color: "#ffe14d" },
    { id: 2, name: "Star", color: "#7cc8ff" },
    { id: 3, name: "Zap", color: "#c38bff" },
    { id: 4, name: "Gem", color: "#4dffc3" },
    { id: 5, name: "Crown", color: "#b6ff3b" },
] as const;

/** Three of a kind pays this many x the bet per symbol; any pair pays PAIR_MULTIPLIER. RTP about 94% (demo math). */
export const TRIPLE_MULTIPLIER = [3, 5, 8, 12, 25, 60] as const;
export const PAIR_MULTIPLIER = 1;

/** payouts[a][b][c] = multiplier x 10,000 (the template's PayoutStructure convention; read it with getPayout). */
function buildPayouts(): PayoutStructure {
    const p: PayoutStructure = {};
    for (let a = 0; a < SYMBOLS.length; a++) {
        p[a] = {};
        for (let b = 0; b < SYMBOLS.length; b++) {
            p[a][b] = {};
            for (let c = 0; c < SYMBOLS.length; c++) {
                const x = a === b && b === c ? TRIPLE_MULTIPLIER[a] : a === b || b === c || a === c ? PAIR_MULTIPLIER : 0;
                if (x) p[a][b][c] = x * 10_000;
            }
        }
    }
    return p;
}

// ── limits ──

export const MIN_BET_PER_SPIN = 0.1;
export const MAX_BET_PER_SPIN = 50;
export const MAX_SPINS = 15;
export const SPIN_PRESETS = [5, 10, MAX_SPINS] as const;

/** Stand-in for the connected wallet's APE balance (on ape.church the platform passes the real one). */
export const DEMO_WALLET_BALANCE = 25;

// ── the game ──

export const myFullScreenGame: Game = {
    title: "My Full Screen Game",
    description: "The template's full-screen example: a three reel slot on the shared console kit.",
    gameAddress: "0x1234567890123456789012345678901234567890",
    // Full-screen backgrounds: a 2560x1440 (16:9) master, everything important inside the centred 1200x1200 square,
    // and nothing important in the bottom ~15% (the console sits there). The template's placeholder is square.
    gameBackground: "/my-full-screen-game/background.png",
    card: "/my-full-screen-game/card.png", // 1:1 aspect ratio (e.g. 512x512)
    banner: "/my-full-screen-game/banner.png", // 2:1 aspect ratio (e.g. 1024x512)
    themeColorBackground: "#F54927",
    song: "/my-full-screen-game/audio/song.mp3",
    payouts: buildPayouts(),
};

// ── console skin ──

/**
 * Your console's look. Every kit piece (bar, plates, buttons, pills) reads the nearest <KitSkinProvider skin={...}>.
 * This example keeps the chrome art and only recolours the text, which needs no new art. A game with its own console
 * art fills the same fields with its files (public/my-full-screen-game/...) and their measured slices: see KitSkin in
 * components/shared/immersive/kit/kitArt.ts.
 */
export const MY_SKIN: KitSkin = {
    ...CHROME_SKIN,
    colors: {
        accent: "#b6ff3b",
        win: "#4dffc3",
    },
};
