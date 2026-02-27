# Ape Church Game SDK — SKILL.md

This file contains instructions for AI agents building games using the Ape Church game template. Read this file in full before writing any code or modifying any files.

---

## 1. Files You May Edit

Only touch files in these locations:

```
components/my-game/          ← all game components go here
public/my-game/              ← all game assets go here
metadata.json                ← fill out before submitting
```

Rename `my-game` to your game's name in kebab-case throughout (e.g. `chicken-crossing`, `slot-machine`). This rename must be consistent across `components/`, `public/`, and `metadata.json`.

---

## 2. Files You Must Never Edit

Do not modify any of the following:

```
app/page.tsx
app/globals.css
app/layout.tsx
components/shared/           ← all files and subfolders
public/shared/               ← all files and subfolders
next.config.ts
tsconfig.json
package.json
package-lock.json
postcss.config.mjs
eslint.config.mjs
components.json
```

These are platform-managed files. Editing them will cause integration failures.

---

## 3. Required Component Files

Your `components/my-game/` folder must contain at minimum:

| File | Purpose |
|---|---|
| `MyGame.tsx` | Root game component. Owns all state and exposes all lifecycle functions. |
| `MyGameWindow.tsx` | Game window wrapper. Child of `GameWindow` from shared. |
| `MyGameSetupCard.tsx` | Bet configuration UI shown in setup view. |

Optional files you may add:
- `myGameConfig.ts` — configuration constants (multipliers, speeds, thresholds, etc.)
- `my-game.styles.css` — game-scoped styles
- Additional component files for complex game elements
- A `svg/` subfolder for SVG components

---

## 4. Required Lifecycle Functions

`MyGame.tsx` must implement all of the following. These are the contract between your game and the platform. Do not rename them.

### `playGame()`
- Validates bet input
- Executes the on-chain transaction (use `console.log` as a mock during development)
- Retrieves the random result
- Initializes all game state needed for animations and logic
- Sets `currentView` to `1` (ongoing)

### `handleReset()`
- Clears ALL game state
- Resets ALL animations and timers
- Removes ALL references to the previous game
- Sets `currentView` to `0` (setup)
- After this call the game must look identical to first load — no exceptions

### `handlePlayAgain()`
- Calls `handleReset()`
- Then calls `playGame()` with new on-chain identifiers
- Used when user wants to place another bet immediately

### `handleRewatch()`
- Calls `handleReset()`
- Re-initializes using existing on-chain data (no new transaction)
- Prepares game to replay via `handleStateAdvance()` if applicable
- No currency is wagered, no transaction is sent

### `handleStateAdvance()` *(implement if applicable)*
- Advances the game through multi-step sequences
- Required for: slot machines with multiple spins, chained reveals, multi-phase animations
- Omit entirely if your game has a single continuous animation

---

## 5. Game State

Use `currentView` to track which view is active:

```typescript
const [currentView, setCurrentView] = useState<0 | 1 | 2>(0)
// 0 = setup view
// 1 = ongoing view
// 2 = game over view
```

Keep all game state consolidated in as few `useState` calls as possible. This makes `handleReset()` reliable. Scattered state is the most common source of reset bugs.

```typescript
// ✅ Correct
const [gameState, setGameState] = useState<GameState>(initialState)
const handleReset = () => setGameState(initialState)

// ❌ Wrong — easy to forget to reset individual values
const [score, setScore] = useState(0)
const [multiplier, setMultiplier] = useState(1)
const [isAnimating, setIsAnimating] = useState(false)
```

---

## 6. Shared Components

Import shared components using absolute paths. Do not copy them into your game folder.

```typescript
import GameWindow from '@/components/shared/GameWindow'
import GameResultsModal from '@/components/shared/GameResultsModal'
import BetAmountInput from '@/components/shared/BetAmountInput'
import CustomSlider from '@/components/shared/CustomSlider'
import ChipSelection from '@/components/shared/ChipSelection'
```

Never use relative paths to reference shared components:
```typescript
// ❌ Wrong
import GameWindow from '../shared/GameWindow'
import GameWindow from '../../components/shared/GameWindow'
```

---

## 7. Asset Rules

**Location** — all assets must live in `public/my-game/`. Do not place assets anywhere else.

**Required assets:**
- `card.png` — 1:1 aspect ratio, minimum 512x512px, used in the game gallery
- `banner.png` — 2:1 aspect ratio, minimum 1024x512px, used on the game detail page

**Format rules:**
- Images: WebP preferred, PNG accepted. No uncompressed formats.
- Audio: MP3 or OGG only. **WAV files are not allowed.**
- Total assets for a game must stay under 10MB.

**Referencing assets in code** — always use absolute paths from `public/`:
```tsx
// ✅ Correct
<img src="/my-game/background.png" />
<audio src="/my-game/audio/soundtrack.mp3" />

// ❌ Wrong
<img src="./assets/background.png" />
<img src="../public/my-game/background.png" />
```

---

## 8. TypeScript Rules

- All game state must have explicit TypeScript interfaces. Define these in `myGameConfig.ts` or at the top of `MyGame.tsx`.
- Do not use `any`. Use `unknown` and narrow the type, or define a proper interface.
- Game result data from on-chain should be typed explicitly, not inferred as `any`.
- All function signatures must have typed parameters and return types.

---

## 9. Code Quality Rules

- Functions should be focused and under 50 lines where possible. Break complex logic into helper functions.
- No global side effects. All state lives inside the React component tree.
- Clean up `setTimeout`, `setInterval`, and animation frame references in `handleReset()`.
- Do not use inline styles for anything beyond dynamic values. Use CSS classes or the game's stylesheet.
- No `console.log` statements in final submission except inside `playGame()` as a mock transaction placeholder.

---

## 10. metadata.json

Fill out `metadata.json` at the repo root. This file is required for submission. All fields are required unless marked optional.

```json
{
  "team": "your-team-name",
  "gameName": "your-game-name",
  "displayTitle": "Your Game Title",
  "description": "A short description of your game. Three sentences max.",
  "authors": [
    {
      "name": "Your Name",
      "email": "your@email.com"
    }
  ],
  "status": "pending",
  "category": "arcade",
  "tags": ["arcade", "example"],
  "thumbnail": "/your-game-name/card.png",
  "banner": "/your-game-name/banner.png",
  "mainComponent": "YourGame.tsx",
  "windowComponent": "YourGameWindow.tsx",
  "setupComponent": "YourGameSetupCard.tsx",
  "configFile": "yourGameConfig.ts",
  "version": "1.0.0"
}
```

Rules:
- `team` and `gameName` must be kebab-case and match your folder names exactly
- `thumbnail` must be `/your-game-name/card.png`
- `banner` must be `/your-game-name/banner.png`
- `status` must be `"pending"` — do not change this value
- `category` must be one of: `arcade`, `card`, `puzzle`, `strategy`, `other`
- `configFile` is optional — only include if your game has a config file

---

## 11. Completion Checklist

Verify every item before considering the build complete. Do not submit until all are true.

**Functionality**
- [ ] `playGame()` initializes game and transitions to `currentView = 1`
- [ ] `handleReset()` returns game to exact first-load state with `currentView = 0`
- [ ] `handlePlayAgain()` successfully starts a new game after completion
- [ ] `handleRewatch()` replays the previous result without any new transaction
- [ ] `handleStateAdvance()` works correctly if the game uses multi-step progression
- [ ] Game renders correctly in default state (before any bet is placed)

**Code quality**
- [ ] No edits to any file outside `components/my-game/`, `public/my-game/`, and `metadata.json`
- [ ] No TypeScript errors — run `npx tsc --noEmit` to confirm
- [ ] No console errors in browser
- [ ] All shared components imported via `@/components/shared/...`
- [ ] All asset paths use `/your-game-name/...` absolute format

**Assets**
- [ ] `card.png` present at 1:1 ratio
- [ ] `banner.png` present at 2:1 ratio
- [ ] No WAV files anywhere
- [ ] Total asset size under 10MB

**metadata.json**
- [ ] All required fields filled
- [ ] `gameName` matches folder name exactly
- [ ] `thumbnail` and `banner` paths are correct
- [ ] `status` is `"pending"`
