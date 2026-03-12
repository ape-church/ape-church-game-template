# Ape Church Game Template

This repository is the official starting point for building games on the Ape Church platform. It includes everything you need to build, test, and submit your game.

**Submissions repo:** [ape-church-game-submissions](https://github.com/ape-church/ape-church-game-submissions)

---

## Getting Started

Click **"Use this template"** → **"Create a new repository"** to create a clean copy in your GitHub account. Do not fork.

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the example game running.

---

## Project Structure

```
app/
  page.tsx                        # DO NOT EDIT
components/
  shared/                         # DO NOT EDIT — platform components, import freely
    GameWindow.tsx
    GameResultsModal.tsx
    BetAmountInput.tsx
    CustomSlider.tsx
    ChipSelection.tsx
    ui/
  my-game/                        # YOUR CANVAS — all your work goes here
    MyGame.tsx
    MyGameWindow.tsx
    MyGameSetupCard.tsx
    myGameConfig.ts               # Optional — game configuration constants
    my-game.styles.css            # Optional — game-scoped styles
public/
  shared/                         # DO NOT EDIT — shared platform assets
  my-game/                        # YOUR ASSETS — all game assets go here
    card.png                      # REQUIRED — 1:1 ratio (e.g. 512x512)
    banner.png                    # REQUIRED — 2:1 ratio (e.g. 1024x512)
    audio/
    sfx/
metadata.json                     # Fill this out before submitting
README.md
```

Rename `my-game` throughout to match your game's name in kebab-case (e.g. `chicken-crossing`).

---

## Game Lifecycle

All games follow this lifecycle:

```
1. Default state (no bet placed)
2. User enters bet
3. playGame() → game starts
4. Game progresses via state or handleStateAdvance()
5. Game finishes
6. User can: Play Again | Rewatch | Reset
```

Track state using `currentView`:
- `0` — setup view
- `1` — ongoing view
- `2` — game over view

---

## Required Functions

Your game component must implement these functions:

### `playGame()`
Starts a new game. Responsible for validating bet input, executing the on-chain transaction, retrieving the result, and initializing all game state.

### `handleReset()`
Fully resets the game to its initial state. Must clear all state, animations, timers, and references to the previous game. After calling this the game should look exactly as it did on first load.

### `handlePlayAgain()`
Starts a new game after one has completed. Should call `handleReset()` then `playGame()` with new identifiers for a fresh on-chain game.

### `handleRewatch()`
Replays the previous game without placing a new bet. Should call `handleReset()` then re-initialize using existing on-chain data. No transaction is sent.

### `handleStateAdvance()` *(optional)*
For games that progress through multiple steps — e.g. slot machines with multiple spins, multi-phase reveals, chained animations.

---

## Technical Requirements

**TypeScript** — all game logic must be strongly typed. No excessive use of `any`.

**Assets** — images must be compressed (WebP preferred, PNG accepted). Audio must be MP3 or OGG — no WAV files. Keep total game assets under 10MB.

**Asset paths** — always reference assets relative to `public/` using an absolute path:
```tsx
// ✅ Correct
<img src="/my-game/background.png" />

// ❌ Wrong
<img src="./assets/background.png" />
```

**Imports** — use absolute imports:
```tsx
// ✅ Correct
import GameWindow from '@/components/shared/GameWindow'

// ❌ Wrong
import GameWindow from '../../../components/shared/GameWindow'
```

**State management** — keep all game state in one place so `handleReset()` can reliably clear it:
```tsx
// ✅ Correct
const [gameState, setGameState] = useState<GameState>(initialState)
const handleReset = () => setGameState(initialState)
```

---

## Revenue Share

Ape Church operates a revenue share model for game creators. A percentage of the house edge collected from your game is paid out to you as the creator.

If you are the sole creator, you receive 100% of the creator revenue split. If multiple people contributed to the game, you decide how to split it — shares must add up to exactly 100.

This is configured in `metadata.json` under the `revenueShare` field:

**Single creator:**
```json
"revenueShare": [
  {
    "name": "Your Name",
    "telegram": "your_telegram_username",
    "address": "0x0000000000000000000000000000000000000000",
    "share": 100
  }
]
```

**Multiple creators:**
```json
"revenueShare": [
  {
    "name": "Your Name",
    "telegram": "your_telegram_username",
    "address": "0x0000000000000000000000000000000000000000",
    "share": 60
  },
  {
    "name": "Collaborator Name",
    "telegram": "collaborator_telegram",
    "address": "0x0000000000000000000000000000000000000000",
    "share": 40
  }
]
```

`address` must be a valid ERC-20 address to receive Ape Coin. Double-check this carefully — payments are sent to this address automatically.

---

## metadata.json

Fill out `metadata.json` at the root before submitting. Every field is required unless marked optional:

```json
{
  "team": "your-team-name",
  "gameName": "your-game-name",
  "displayTitle": "Your Game Title",
  "description": "A short description. Three sentences max.",
  "authors": [
    {
      "name": "Your Name",
      "telegram": "your_telegram_username"
    }
  ],
  "revenueShare": [
    {
      "name": "Your Name",
      "telegram": "your_telegram_username",
      "address": "0x0000000000000000000000000000000000000000",
      "share": 100
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
  "version": "1.0.0",
  "submittedAt": "YYYY-MM-DD"
}
```

`team` and `gameName` must be kebab-case. `category` must be one of: `arcade`, `card`, `puzzle`, `strategy`, `other`. `configFile` is optional — only include if your game has a config file.

---

## Submitting Your Game

When your game is ready, submit it to the **[ape-church-game-submissions](https://github.com/ape-church/ape-church-game-submissions)** repository. Read the submissions repo README carefully — it covers exactly which files to include in your PR and what the review process looks like.

**Files you submit:**
```
components/games/your-game-name/    ← note the games/ wrapper added on submission
public/submissions/your-game-name/
submissions/your-team-name/your-game-name/metadata.json
```

> Note the path difference: your components live in `components/my-game/` in this template, but must be submitted under `components/games/your-game-name/` in the submissions repo.

---

## Pre-Submission Checklist

- [ ] All required lifecycle functions implemented and tested
- [ ] `handleReset()` fully clears all game state
- [ ] `handleRewatch()` replays without sending a new transaction
- [ ] `card.png` and `banner.png` present at correct dimensions
- [ ] All assets under 10MB total, no WAV files
- [ ] `metadata.json` complete and valid
- [ ] `revenueShare` shares sum to exactly 100
- [ ] All `address` fields are valid ERC-20 addresses
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors in browser
- [ ] Tested on different screen sizes

---

## Support

- **Email:** [ministry@ape.church](mailto:ministry@ape.church)
- **Telegram:** [https://t.me/+wgoE4TSxxcM5Njdh](https://t.me/+wgoE4TSxxcM5Njdh)
- **Discord:** [https://discord.gg/3Jxeeqt59W](https://discord.gg/3Jxeeqt59W)
