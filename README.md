# Ape Church Game Template

Welcome to the official game template for Ape Church! This repository provides everything you need to build, test, and submit your web-based game.

## 🎮 Quick Start

### 1. Clone This Repository

```bash
git clone https://github.com/ape-church/ape-church-game-template
cd ape-church-game-template
npm install
npm run dev
```

Visit `http://localhost:3000` to see the example game running.

### 2. Build Your Game

Replace the "my game" with your own implementation. All your game files should go in:

```
components/my-game/
├── MyGame.tsx              # Your main game logic
├── MyGameWindow.tsx        # Your game window wrapper
├── MyGameSetupCard.tsx     # Your game setup/bet UI
└── my-game.styles.css      # Optional game-specific styles
```

### 3. Test Locally

Make sure your game:
- ✅ Renders correctly in the default state
- ✅ Handles all lifecycle functions properly
- ✅ Can fully reset and replay
- ✅ Works with the provided mock components

### 4. Submit Your Game

When ready, follow the detailed **[SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md)** to submit your game to the hackathon platform.

**Quick overview:**
1. Fork the [hackathon-platform](https://github.com/ape-church/ape-church-hackathon-platform) repository
2. Create your team folder in `app/submissions/`
3. Copy your game files from this template
4. Open a Pull Request
5. Automated validation runs
6. Team reviews within 24 hours
7. Game deployed in next hourly batch

📖 **[Read the complete submission guide →](SUBMISSION_GUIDE.md)**

---

## 🎯 Technical Requirements

### TypeScript

All game logic, state management, and components must be written in TypeScript:

- ✅ Strong typing for game state
- ✅ Proper interfaces and types
- ❌ No excessive use of `any`

### Optimized Assets

- **Images:** Compressed, WebP preferred (fallback to PNG/JPG)
- **Audio:** Compressed, optimized for web (MP3/OGG)
- **Total size:** Keep under 10MB per game
- ❌ Avoid uncompressed WAV, large PNGs, oversized spritesheets

### Required Banner Assets

Two images are required for your game listing:

1. **Card Image** (`card.png`)
   - Aspect ratio: 1:1 (square)
   - Recommended: 512x512px
   - Used in game gallery

2. **Banner Image** (`banner.png`)
   - Aspect ratio: 2:1 (wide)
   - Recommended: 1024x512px
   - Used on game detail page

### Deterministic & Replayable

Games must be able to replay an on-chain result without placing a new bet:

- ✅ Game state fully resettable
- ✅ Results reproducible from on-chain data
- ✅ Rewatch works without new transaction

---

## 🔄 Game Lifecycle

All games follow a predictable lifecycle:

```
1. Default State (no bet placed)
   ↓
2. User enters bet information
   ↓
3. playGame() called (siumlates blockchain interaction)
   ↓
4. Game progresses (animations, reveals)
   ↓
5. Game finishes (results shown)
   ↓
6. User can: Play Again | Rewatch | Reset
```

### Game States

Use `currentView` to track game state:

- **0**: Setup view (bet configuration)
- **1**: Ongoing view (game playing)
- **2**: Game over view (results)

### Default State

Before any bet is placed, your game must:

- Render a stable, static or animated default UI
- Not assume bet amount or wallet connection
- Not require on-chain data to display

---

## 🛠️ Required Game Functions

Your game component must expose these functions:

### `playGame()`

Initializes and starts a new on-chain game.

```typescript
const playGame = async () => {
  // 1. Validate bet input
  // 2. Execute on-chain transaction (console.log sufficient)
  // 3. Retrieve random number/result
  // 4. Initialize game state for animations
  // 5. Update currentView to 1 (ongoing)
};
```

**Purpose:** Start a brand new game with a new bet.

### `handleStateAdvance()` (optional)

Used for games with multiple steps or rounds.

```typescript
const handleStateAdvance = () => {
  // Progress to next state
  // Examples: next spin, next card reveal, next round
};
```

**Examples:**
- Slot machines with multiple spins
- Multi-phase animations
- Games with chained reveals

### `handleReset()`

Fully resets the game to initial state.

```typescript
const handleReset = () => {
  // 1. Clear all game state
  // 2. Reset animations
  // 3. Reset multipliers, reels, cards, timers
  // 4. Set currentView back to 0 (setup)
  // After reset, game looks like first load
};
```

**Purpose:** Clean slate for new game setup.

### `handlePlayAgain()`

Starts a brand new game after completion.

```typescript
const handlePlayAgain = () => {
  handleReset();
  // User will configure new bet
  // Then playGame() will be called
};
```

**Purpose:** Quick path to play another round.

### `handleRewatch()`

Replays previous game without new bet.

```typescript
const handleRewatch = () => {
  // 1. Reset game state
  // 2. Re-initialize using existing on-chain data
  // 3. Replay animations with same result
  // 4. NO new transaction or bet
};
```

**Purpose:** View previous game result again.

---

## 📁 Project Structure

Recommended structure in the template:
*DNE = Do Not Edit*
*E = Edit*

```
ape-church-game-template/
├── app/
│   ├── globals.css                    # Global styles (DNE)
│   └── page.tsx                       # Main game page (DNE)
├── components/
│   ├── BetAmountInput.tsx             # Template bet input (DNE)
│   └── CustomSlider.tsx               # Template slider (DNE)
│   ├── GameWindow.tsx                 # Template game window component (DNE)
│   ├── GameResultsModal.tsx           # Template results modal (DNE)
│   ├── ui/
│   │   └── ...                        # ShadCN ui components (DNE)
│   └── my-game/
│       ├── MyGame.tsx             	   # My game logic (E)
│       ├── MyGameWindow.tsx       	   # My window wrapper (E)
│       ├── MyGameSetupCard.tsx    	   # My setup card (E)
│       ├── my-game.styles.css     	   # My game styles (E)
│       └── ...                        # Other components. Write light-weight components as needed here (E)
├── lib/
├── ├── gameConfig.ts                  # Shared type definitions (E)
├── ├── metadata.json                  # metadata file (E)
├── public/
│   └── my-game-assets/ 			      # Folder to add all assets (E)
│       ├── background.png
│       ├── card.png                   # REQUIRED: 1:1 ratio
│       ├── banner.png                 # REQUIRED: 2:1 ratio
│       └── ...other assets
├── README.md
└── package.json
```

---

## 🧪 Testing Your Game

### Local Testing Checklist

Before submitting, verify:

- [ ] Game renders in default state without errors
- [ ] All lifecycle functions work correctly
- [ ] `playGame()` initializes game properly
- [ ] `handleReset()` fully clears game state
- [ ] `handlePlayAgain()` starts fresh game
- [ ] `handleRewatch()` replays without new bet
- [ ] `handleStateAdvance()` works (if applicable)
- [ ] Animations are smooth and performant
- [ ] Assets are optimized (< 10MB total)
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors
- [ ] Game works on different screen sizes

### Mock Components

This template includes mock versions of platform components:

- `GameWindow` - Window container
- `GameResultsModal` - Results display
- `BetAmountInput` - Bet amount selector
- `CustomSlider` - Slider control

These allow you to develop locally. When submitted to the platform, your imports will automatically use the real components.

---

## ⚠️ Common Issues

### Import Paths

Make sure to use absolute imports:

```tsx
// ✅ Correct
import GameWindow from '@/components/GameWindow';
import { GameState } from '@/lib/types';

// ❌ Wrong
import GameWindow from '../../../components/GameWindow';
```

### Asset Paths

Use proper Next.js public paths:

```tsx
// ✅ Correct
<Image src="/my-game-assets/background.png" />

// ❌ Wrong
<Image src="./assets/background.png" />
```

### State Management

Keep game state isolated and resettable:

```tsx
// ✅ Correct - all state in one place
const [gameState, setGameState] = useState<GameState>(initialState);

const handleReset = () => {
  setGameState(initialState);
};

// ❌ Wrong - scattered state
const [score, setScore] = useState(0);
const [multiplier, setMultiplier] = useState(1);
// ... forgetting to reset some state
```

---

## 📞 Support

Need help? Reach out through:

- **Email:** [ministry@ape.church](mailto:ministry@ape.church)
- **Telegram:** [https://t.me/+wgoE4TSxxcM5Njdh](https://t.me/+wgoE4TSxxcM5Njdh)
- **Discord:** [https://discord.gg/3Jxeeqt59W](https://discord.gg/3Jxeeqt59W)

When asking for help, include:

- Brief description of your game
- The issue you're encountering
- Screenshots or error messages
- Steps to reproduce

---

## 🏆 Great Games Tips

### Stand Out

- Polish your animations and sound effects
- Create unique game mechanics
- Optimize performance
- Write clean, readable code
- Add helpful comments

### Don't Worry About

- Complex blockchain integration (we handle that)
- Backend infrastructure (we provide it)
- Production deployment (automated)
- Hosting costs (covered)

### Focus On

- Fun, engaging gameplay
- Smooth user experience
- Visual polish
- Code quality
- Following the lifecycle requirements

---

## 📝 Final Checklist

Before submitting your PR:

- [ ] Game fully implements all required lifecycle functions
- [ ] Both banner assets included (card.png, banner.png)
- [ ] metadata.json complete and valid
- [ ] Assets optimized (< 10MB total)
- [ ] No TypeScript errors
- [ ] Tested locally and works correctly
- [ ] README.md included (optional but nice)
- [ ] Code is clean and commented
- [ ] Follows naming conventions (kebab-case)
- [ ] One game per PR

---

Good luck with your submission! We can't wait to see what you build! 🎮🚀
