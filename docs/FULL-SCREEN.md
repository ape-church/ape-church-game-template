# Full-screen games: the immersive frame + console kit

This is the reference for the **full-screen layout**, the layout new Ape Church games are built on. Every recent
ape.church game uses it (Blackjack+, Roulette, Hoo Hee How, Dojo Drop, Reel Pirates, Gimboz of the Galaxy...). The
HUD layout ([`GAME-HUD.md`](./GAME-HUD.md), setup card in a side panel) is still supported, but pick full screen unless
your game really needs a setup card.

Run `npm run dev` and open:

| Route | What it is | Source |
|---|---|---|
| `/full-screen` | **The example game.** A 3-reel slot on the kit's slot console. Start here. | `components/my-full-screen-game/` |
| `/full-screen/table` | **Table kit reference.** A custom console (chip rack, plates, round buttons, big button) for table-style games. | `components/my-full-screen-game/table-kit-reference/` |
| `/` | The HUD example (setup card layout), for comparison. Same game logic. | `components/my-game/` |

---

## 1. What it looks like

```
┌──────────────────────────────────────────────────────────────┐
│  site nav (80px; hidden in browser full screen)              │
├──────────────────────────────────────────────────────────────┤
│ [≡][< GAMES]                     [your pills][HISTORY][⛶]    │ ← corner pills
│                                                              │
│                    your scene, edge to edge                  │ ← stage = one viewport
│                                                              │   tall under the nav
│                                                              │
│ ╭─[BALANCE]─[½ BET 2×]──────[− SPINS +]─────────────( BIG )─╮│ ← the console
│ ╰────────────────────────────────────────────────────────────╯│
└──────────────────────────────────────────────────────────────┘
   history / leaderboard below the fold (scroll, or the HISTORY pill)
```

- **The stage is exactly one viewport tall** under the site nav. No title bar, no window border, no box: your scene
  draws edge to edge.
- **The site sidebar slides out.** The Menu pill slides it back in over the stage.
- **The console sits at the bottom of the stage.** On desktop it's the chrome bar; on phones and portrait screens it's
  a 9-slice panel with a different arrangement.
- **Browser full screen** (the ⛶ pill) also hides the site nav, so the game gets the whole screen.
- **Ultrawide:** the stage stops widening at `maxAspect` (default 2.4). Past that, the sides show a blurred, darkened
  continuation of `backdrop` instead of stretched art.
- **Below the fold:** anything you pass as `below` (history, leaderboard). It stays off the stage.

---

## 2. The pieces

All of these are platform-managed: **do not edit them**. You compose them from inside your game folder.

| Piece | File | Job |
|---|---|---|
| `ImmersiveGameFrame` | `components/shared/immersive/ImmersiveGameFrame.tsx` | The page frame: stage height, ultrawide pillars, the `below` slot, the sidebar drawer. |
| `ImmersiveGameWindow` | `components/shared/immersive/ImmersiveGameWindow.tsx` | Session plumbing with no chrome: music, loading / paused overlays, the shared results modal. |
| `useImmersiveFrameControls` | `components/shared/immersive/frameControls.ts` | What the corner pills do (menu, games, history, full screen). |
| `immersive.css` | `components/shared/immersive/immersive.css` | Global rules that reshape the site shell while the frame is on the page. Imported by the page. |
| `KitSlotStage` | `components/shared/immersive/kit/SlotConsole.tsx` | A complete stage for slot-style games: your scene + the console + corner pills, desk and phone. |
| Chrome kit | `components/shared/immersive/kit/ChromeKit.tsx` | The console as parts: `KitConsoleBar`, `KitConsolePanel`, `KitPlate`, `KitChipRack`, `KitRoundButton(s)`, `KitBigButton`, `KitCorners`, `KitPill`, `KitPanel`, `KitNotice`. |
| Skins | `components/shared/immersive/kit/kitArt.ts`, `skin.tsx` | `KitSkin` + `<KitSkinProvider>`: re-dress every kit piece with your art and colours. |
| GP | `kit/GpSwitch.tsx`, `kit/useGpPayment.ts` | The APE / GP switch on the balance plate, GP mode rules, `gpPlates()`. |
| Template stand-ins | `components/shared/immersive/platform.ts`, `MockSiteShell.tsx` | Local versions of the site's prefs, APE price, GP balance, top nav and sidebar. Swapped for the real ones on integration. |

Kit art lives in `public/shared/kit/` (Blackjack+'s chrome + lime console).

---

## 3. Building a game: the slot path (`KitSlotStage`)

If your game is "set a bet (and maybe a count), press the big button, watch it play out", use `KitSlotStage`. You
don't write any console layout code. You map your state onto `SlotConsoleData` and draw your scene.

The example's tree (`components/my-full-screen-game/MyFullScreenGame.tsx`):

```tsx
const frame = useImmersiveFrameControls(true); // Menu, Games, History, Full screen

<ImmersiveGameFrame backdrop={game.gameBackground} maxAspect={2.4} below={<History />}>
  <ImmersiveGameWindow game={game} currentGameId={id} isGameFinished={gameOver} /* ...lifecycle props */>
    <MyFullScreenGameStage frame={frame} scene={renderScene} /* ...state */ />
  </ImmersiveGameWindow>
</ImmersiveGameFrame>
```

`MyFullScreenGameStage.tsx` builds the console data and hands it to the kit:

```tsx
<KitSkinProvider skin={MY_SKIN}>
  <KitSlotStage
    scene={(L) => <MyScene L={L} />}  // your scene, laid out from L
    console={data}                       // SlotConsoleData: view, bet, spins, readouts, big, actions, balance, auto
    frame={frame}
    notice={notice}                      // one-line status chip above the console (setup only)
    rightExtra={(phone) => <KitPill ... />}  // your corner pills (paytable, sound, music)
    overlay={paytable && <PaytableOverlay />}
  />
</KitSkinProvider>
```

What the console shows per view:

| `view` | Left | Centre | Right |
|---|---|---|---|
| `0` setup | balance (with the APE / GP switch), bet per spin (½ / 2×, editable, APE / USD) | spin count (− / +, presets) | big button ("Buy spins") |
| `1` playing | first readout (win so far) | other readouts (spins left, bet) | auto toggle, big button ("Spin") |
| `2` finished | readouts (balance, total bet, total payout) | | actions (Rewatch, Change bet), big button ("Play again") |

On phones the kit rearranges the same data into a panel: an info line, then the controls (or the main readout) beside
the big button. You don't build the phone console.

### The scene and `L`

Your scene is a function of the stage layout `L` (`SlotStageLayout`):

| Field | Meaning |
|---|---|
| `L.mode` | `"desk"` or `"phone"` (below 760 px wide, or portrait). Change your scene's **shape** on phones, not just its size. |
| `L.w`, `L.h` | The stage size in screen px. |
| `L.top` | Px to keep clear at the top (the corner pills on phones; 0 on desk). |
| `L.bottom` | Px to keep clear at the bottom (the console). |
| `L.bigTop`, `L.bigLeftFromRight` | Where the big button rises above the console on desktop, for scenery standing at the right. |
| `L.k` | The console's design scale (px per design px), if you want scene UI to match it. |

Rules:

1. **The scene root fills the stage** (`position: absolute; inset: 0`). Backgrounds run under the console: the console
   art sits on top of your room, not in a box below it.
2. **Keep gameplay inside `L.top` .. `L.h - L.bottom`.** Nothing interactive under the console or the corner pills.
3. **Never use `vw` / `vh`.** The stage is not the viewport. Size from `L` (or the container), never from `window`.
4. **Never remount on a layout flip.** `KitSlotStage` renders your scene in one place for both layouts, so resizing a
   window or rotating a phone keeps a running round alive. Don't key your scene on `L.mode`. A canvas / WebGL scene
   resizes its renderer from `L` and keeps its world.
5. **Canvas / WebGL:** fit the camera by the constraining axis and inset it so the subject clears the console
   (`L.bottom`). A perspective camera's `fov` is vertical: changing only `aspect` reveals more background without
   making the subject bigger.

---

## 4. The lifecycle is unchanged

Full screen changes the shell, not the contract. `MyFullScreenGame.tsx` implements the same functions as the HUD
example (see `SKILL.md` §5): `playGame`, `handleReset`, `handlePlayAgain`, `handleRewatch`, `handleStateAdvance`, with
`currentView` 0 / 1 / 2 driving the console.

Patterns the example shows:

- **The big button shows the purchase in flight.** Pass `busy: isLoading` on `big`: it spins in its live art and
  ignores clicks. Don't grey the stage with a loading overlay for your own purchase. `ImmersiveGameWindow`'s
  `isLoading` overlay is for loading a replay (`?id=`).
- **Results come from the chain once, then play back.** `playGame` reads every spin's result up front; spins, rewatch
  and `?id=` replays play the same results. The example derives them from the game id as a stand-in.
- **Auto spin:** `console.auto = { on, onToggle }`. The game presses Spin itself once each spin has played out.
- **Results modal:** `ImmersiveGameWindow` shows the platform's shared results modal at `isGameFinished`. If your scene
  presents results itself (a result plaque), pass `hideResultsModal`.
- **Money is APE in state, always.** USD is a display toggle (`usePlatformPrefs().usdMode`). Convert at the edges:
  the bet input converts to APE on commit.

---

## 5. GP (paying with Gimbo Points)

GP is chosen **on the balance plate**, never with a pill floating in a stage corner:

```tsx
const gp = useGpPayment(); // { mode, toggle, available, active, balance, costOf }

balance: gp.active
  ? { label: "GP BALANCE", value: gpMoney(gp.balance), tone: "accent", labelRight: gpSwitch }
  : { label: "Balance", value: amount(walletBalance), labelRight: gp.available ? gpSwitch : undefined },
```

`gpPlates(gp, betApe)` gives you the GP balance and GP cost plates, plus `short` when the player can't cover the bet.
Lock the big button on `short`. The bet stays APE in state; the platform charges `gp.costOf(bet)` GP. A GP-paid round
can't use "Play again" (the player re-chooses GP on the console), so set `canPlayAgain` false after one.

---

## 6. Building a game: the table path (custom console)

Table games (chips on a felt, one action button, like Blackjack+ and Hoo Hee How) build their own console from the kit
parts. See `table-kit-reference/TableKitExample.tsx`. The pattern:

1. **Measure the stage box** with a `ResizeObserver` (never `window`).
2. **Pick a layout:** `phone` below 760 px wide or when portrait, else `desk`.
3. **Fit a design-px stage, then extend it:** `scale = min(boxW / minW, boxH / baseH)`, `W = boxW / scale`,
   `H = boxH / scale`. Lay everything out in design px inside a `W x H` div with `transform: scale(scale)` from its
   top left. Nothing is letterboxed or cropped: wider screens just get more room.
4. **Place the parts:**

```tsx
// desk: the chrome bar across the stage, content held to the middle consoleW design px
<KitConsoleBar top={H - hudH - 12} height={hudH} W={W} contentW={consoleW}>
  <KitPlate phone={false} label="Balance" value={{ value: "25", unit: "APE" }} />
  <KitPlate phone={false} label="Total bet" value={...} bad={short} />
  <KitChipRack values={[1, 5, 10, 25, 100]} selected={chip} onSelect={setChip} width={440} disabled={busy} />
  <KitRoundButtons gap={12}>
    <KitRoundButton icon={KIT_ICONS.undo} label="Undo" size={58} onClick={undo} disabled={!canUndo} tip />
  </KitRoundButtons>
  <KitBigButton label="Roll" size={132} onClick={roll} disabled={!canRoll} busy={rolling} fontSize={24} />
</KitConsoleBar>

// phone: a 9-slice panel; you lay out its rows (grid / flex)
<KitConsolePanel top={H - hudH - 6} height={hudH} style={{ left: 6, width: W - 12, display: "grid", ... }}>...</KitConsolePanel>

<KitCorners controls={frame} phone={phone} fontSize={15} rightExtra={<KitPill label="Rules" ... />} />
<KitNotice x={W / 2} y={...} fontSize={14}>Not enough APE for this bet</KitNotice>
{rules && <KitPanel title="Rules" rows={[["Low", "1.9x"]]} W={W} areaH={H - hudH} phone={phone} onClose={...} />}
```

Everything is sized in **design px** and drawn inside your scaled stage. The game owns the layout; the kit owns the
look.

---

## 7. Skins: your console's look

Every kit piece reads the nearest `<KitSkinProvider skin={...}>`. Without one you get the chrome + lime default
(`CHROME_SKIN`).

- **Recolour only** (no new art): spread `CHROME_SKIN` and set `colors` (`accent`, `win`, `bad`, `label`, `value`,
  `bigText`, `pillBg`...). The example's `MY_SKIN` does this.
- **Your own console art:** fill the `KitSkin` fields with your files in `public/my-game/` and their measured slices:
  `bar` (3-slice: `panelFrac`, `panelCentre`, `capFrac`), `plate` / `panel` (9-slice `slice` + border widths),
  `roundButton`, `big` (idle / hover / pressed / disabled, blank face: the label is code), `pill` (optional 3-slice).
  Options: `flush` (console sits on the stage's bottom edge), `bigPress`, `bigFace`, `phoneLabel`.
- **Never edit `kitArt.ts` or the art in `public/shared/kit/`.** Other games use them.

---

## 8. Art for full screen

- **Backgrounds:** a 2560x1440 (16:9) master with everything important inside the centred 1200x1200 square. Expect the
  bottom ~15% to sit under the console and the top corners under the pills. The same image works as `backdrop`
  (the blurred ultrawide pillars).
- **Phones get a portrait composition** where it matters (a separate `-m` background or scene layout), not a crop of
  the desktop art.
- **Bake UI into the scene where you can.** A table, dish or board painted into the room reads far better than a CSS
  box floating over a background.

---

## 9. On ape.church vs this template

| Here | On ape.church |
|---|---|
| `MockSiteShell` (fake nav + sidebar) | The real NavTop + AppSidebar (same `data-*` hooks) |
| `platform.ts`: `usePlatformPrefs`, `APE_PRICE_USD`, `DEMO_GP_BALANCE` | UserPreferences, the live APE price, the wallet's GP balance |
| `DEMO_WALLET_BALANCE`, simulated purchase | The wallet balance, the real transaction + VRF result |
| Results modal without GP earned | Adds GP earned, PnL share, "watch a player" |
| Games pill links to `/games` (404 here) | The games lobby |

Games on ape.church often keep the classic layout reachable with `?layout=hud` as a way back. That's optional. If you
want it, render the HUD tree from `components/my-game` when `useSearchParams().get("layout") === "hud"`, and pass
`useImmersiveFrameControls(!hudLayout)`.

---

## 10. Checklist

- [ ] Page imports `@/components/shared/immersive/immersive.css` and wraps the game in a `Suspense` (it reads `?id=`)
- [ ] `ImmersiveGameFrame` > `ImmersiveGameWindow` > your stage; history / leaderboard passed as `below`, never on the stage
- [ ] Slot path: state mapped onto `SlotConsoleData` for views 0, 1 and 2; table path: `KitConsoleBar` on desk, `KitConsolePanel` on phones
- [ ] Scene fills the stage and keeps gameplay between `L.top` and `L.h - L.bottom`; no `vw` / `vh`
- [ ] The scene survives a desk / phone flip without remounting (resize the window mid-round)
- [ ] The big button's `busy` shows the purchase in flight; no grey overlay for your own purchase
- [ ] GP only via `KitGpSwitch` on the balance plate; bet stays APE in state
- [ ] Your corner pills (paytable / rules, sound, music) via `rightExtra` / `KitPill`
- [ ] Tested at 1280x720, 1440x900, 1920x1080, 2560x1080 (ultrawide), a 390x844 phone, and with browser full screen on
- [ ] No edits to `components/shared/`, `public/shared/`, `app/`
