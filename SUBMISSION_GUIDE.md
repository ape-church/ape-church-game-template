# Submission Guide

When submitting your game to the `ape-church-game-submissions` repository, you **must** include the following files and folders:

## Required Files to Submit

### 1. Game Components (Required)
```
components/my-game/
├── MyGame.tsx
├── MyGameWindow.tsx
└── MyGameSetupCard.tsx
```

### 2. Game Configuration (Required)
```
lib/gameConfig.ts
metadata.json
```
> **Note:** Only submit the game configuration object (e.g., `myGame` or your game's export). You may remove the `exampleGame` if you've replaced it.

### 3. Game Assets (Required)
```
public/my-game/
├── background.png          # REQUIRED
├── card.png                # REQUIRED - 1:1 aspect ratio
├── banner.png              # REQUIRED - 2:1 aspect ratio
├── advance-button.png      # Optional
├── audio/                  # Optional
└── sfx/                    # Optional
    ├── win.wav
    └── lose.mp3
```

### 4. App Entry Point (Required)
```
app/page.tsx
```
> **Note:** Only submit if you've modified it. If you only changed the import to use your game component, include it.

## Files NOT to Submit

Do **NOT** submit these files (they are platform-managed):

- `components/GameWindow.tsx`
- `components/GameResultsModal.tsx`
- `components/BetAmountInput.tsx`
- `components/CustomSlider.tsx`
- `components/ui/*` (all UI components)
- `app/layout.tsx`
- `app/globals.css`
- `package.json` / `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- Any configuration files

## Submission Checklist

Before submitting, ensure:

- [ ] All game components are in `components/my-game/`
- [ ] All assets are in `public/my-game/`
- [ ] Game configuration is exported from `lib/games.ts`
- [ ] All asset paths in code use `/my-game/` (not `/example-game-assets/`)
- [ ] Game follows the required lifecycle (playGame, handleReset, handlePlayAgain, handleRewatch)
- [ ] Game can reset and replay properly
- [ ] All TypeScript types are properly defined (no excessive `any` types)
- [ ] Assets are optimized (compressed images, optimized audio)
- [ ] Required assets (card.png, banner.png) are present and correct dimensions

## File Naming Convention

You can rename `my-game` to your game's name (e.g., `slot-machine`, `poker-game`), but ensure:

1. Folder names match: `components/your-game-name/` and `public/your-game-name-assets/`
2. All imports and asset paths are updated accordingly
3. Component names can remain `MyGame.tsx` or be renamed to match your game

## Questions?

If you're unsure about what to include, reach out:
- **Email:** [ministry@ape.church](mailto:ministry@ape.church)
- **Telegram:** [https://t.me/+wgoE4TSxxcM5Njdh](https://t.me/+wgoE4TSxxcM5Njdh)
- **Discord:** [https://discord.gg/3Jxeeqt59W](https://discord.gg/3Jxeeqt59W)
