
# Ape Church Game Template Repository

This repository is a **template and reference implementation** for teams building web-based games that will later be **listed and integrated into the main platform**.

## How to Use This Template (Submission Flow)

This repository is **read-only** for external developers. Do **not** submit pull requests to this repository.

---

### Step-by-step

1. **Fork this repository**

   * Use **“Use this template”** or fork it into your own GitHub account

2. **Build your game in your fork**

   * Replace the example game with your own implementation
   * Follow the required project structure
   * Implement all required lifecycle functions
   * Add optimized assets (including required banner assets)

3. **Test your game locally**

   * Default state renders before bet input
   * Game can fully reset and replay
   * Rewatch works without placing a new bet

4. **Submit your game for review**

   * Open a Pull Request from your fork to the **`ape-church-game-submissions`** repository ([here](https://github.com/ape-church/ape-church-game-submissions))
   * One Pull Request per game

5. **Review & iteration**

   * Our team will review your submission
   * Requested changes should be made in your fork

6. **Approval & integration**

   * Approved games are manually integrated into the live platform
   * Merging a PR does **not** guarantee production deployment

---

## Tech Requirements

Your game **must** meet the following baseline requirements:

* **TypeScript**

  * All game logic, state management, and components should be written in TypeScript
  * No `any`-heavy or loosely typed game state

* **Optimized Assets**

  * Images must be compressed (WebP preferred when possible)
  * Audio must be compressed and optimized for web delivery
  * Avoid uncompressed WAV, large PNGs, or oversized spritesheets

* **Deterministic & Replayable**

  * Games must be able to replay an on-chain result without placing a new bet
  * Game state must be fully resettable and reproducible

---

## Game Lifecycle Overview

All games are expected to follow a predictable lifecycle so they can be:

* Initialized
* Played
* Advanced (if applicable)
* Reset
* Replayed or rewatched

At a high level:

1. User lands on the game (default state)
2. User enters bet information
3. `playGame()` is called (this is where the blockchain contracts will be called)
4. Game progresses via internal state or `handleStateAdvance()`
5. Game finishes
6. User may **Play Again** or **Rewatch** the previous game, or **reset** to configure another game. 

---

## Required Game States

Note that we use state `currentView` in the game component (`components/ExampleGame.tsx`) to track the state of the game.
The states are as follows:
- 0: setup view
- 1: ongoing view
- 2: game over view

### Default State

Before the user enters any bet information, the game **must**:

* Render a stable, non (or minimally) animated default UI
* Not assume a bet amount, wallet connection, or on-chain data

---

## Required Game Functions

Your game **must expose the following functions**. These act as the contract between your game and the platform.

### `playGame()`

Initializes and starts a new on-chain game.

This function is responsible for:

* Validating user bet input
* Executing the on-chain transaction
* Retrieving the random number / game result
* Initializing all game state needed for animations and logic

> Think of `playGame()` as **"start a brand new game"**.

---

### `handleStateAdvance()` *(optional)*

Used for games that advance through multiple steps or rounds.

Examples:

* Slot machines with multiple spins
* Games with chained reveals
* Multi-phase animations

---

### `handleReset()`

Fully resets the game to its initial state.

This **must**:

* Clear all game state
* Reset animations
* Reset multipliers, reels, cards, timers, etc.
* Remove any references to the previous on-chain game

> After calling `handleReset()`, the game should look like it did on first load.

---

### `handlePlayAgain()`

Starts a brand new game after one has completed.

This function should:

1. Call `handleReset()`
2. Call `playGame()`
3. Attach **new critical identifiers** used to construct a new on-chain game

> This is how users place another bet and generate a new on-chain result.

---

### `handleRewatch()`

Replays a previously completed on-chain game **without placing a new bet**.

This function should:

1. Call `handleReset()`
2. Re-initialize the game using existing on-chain data
3. Prepare the game so it can advance via `handleStateAdvance()` (if applicable)

Important notes:

* **No currency is wagered**
* **No new transaction is sent**
* This is strictly for viewing the outcome again

---

## Integration Expectations

To be listed on the platform, your game must:

* Follow this lifecycle exactly
* Expose the required functions
* Avoid global side effects
* Cleanly reset between games

Games that do not properly reset or replay will not be accepted. 

---

## Project Structure

While not strictly required, the following structure is encouraged:

```
├── app/
│   └── page.tsx                        # Main game page
├── components/
│   ├── GameWindow.tsx                  # Generic game window
│   ├── GameResultsModal.tsx            # Generic results modal
│   └── example-game/
│       ├── ExampleGame.tsx             # Specific game component
│       ├── ExampleGameWindow.tsx       # Specific game window - child of GameWindow
│       ├── ExampleGameSetupCard.tsx    # Specific game setup card
│       └── example-game.styles.css     # Optional, game-scoped styles
├── lib/
│   └── games.ts                        # Game types
├── public/
│   └── example-game-assets/
│       ├── background.png              # Background image for game window
│       ├── card.png                    # REQUIRED – 1:1 aspect ratio (e.g. 512x512)
│       ├── banner.png                  # REQUIRED – 2:1 aspect ratio (e.g. 1024x512)
│       ├── advance-button.png          # Optional – Button to advance to next state
│       └── ...other assets    
```

---

## Support & Contact

If you have questions while building your game or run into integration issues, you can reach out through the following channels:

* **Email:** [ministry@ape.church](mailto:ministry@ape.church)
* **Telegram:** [https://t.me/+wgoE4TSxxcM5Njdh](https://t.me/+wgoE4TSxxcM5Njdh)
* **Discord:** [https://discord.gg/3Jxeeqt59W](https://discord.gg/3Jxeeqt59W)

We recommend including:

* A short description of your game
* The issue or question you’re encountering
* Screenshots or screen recordings if applicable

---

## Final Notes

This template exists to make life easier for:

* Game developers
* Reviewers
* Platform integrators

If you follow these guidelines, your game will be:

* Easier to audit
* Easier to integrate
* Easier to scale









