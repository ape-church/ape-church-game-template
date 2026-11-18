"use client";

/**
 * GameWindow for the immersive (full-screen) frame. DO NOT EDIT. See docs/FULL-SCREEN.md.
 *
 * The same session plumbing as components/shared/GameWindow (game music, the paused / loading overlays, the shared
 * results modal) with none of its chrome: no border, no rounded box, no background art, no corner sound buttons. It
 * fills its parent; your stage draws the whole scene and owns its own sound controls (corner pills).
 *
 * Template build: music + display prefs come from ./platform (usePlatformPrefs). On ape.church the same component also
 * handles the global pause, GP earned in the results modal and "watch a player"; your game gets those for free.
 */

import React, { useEffect, useRef } from "react";
import { Howl } from "howler";
import type { Game } from "@/lib/games";
import GameResultsModal from "@/components/shared/GameResultsModal";
import { APE_PRICE_USD, usePlatformPrefs, type PaymentMode } from "./platform";

const FALLBACK_SONG = "/my-game/audio/song.mp3";

export interface ImmersiveGameWindowProps {
  game: Game;
  children: React.ReactNode;
  isLoading: boolean;
  isGameFinished: boolean;
  betAmount: number | null;
  payout: number | null;
  inReplayMode: boolean;
  isUserOriginalPlayer: boolean;
  showPNL: boolean;
  isGamePaused?: boolean;
  /** GP-paid rounds can't be replayed with "Play again" (the player picks GP again on the console). */
  lastPlayPaymentMode?: PaymentMode | null;
  showPlayAgainInReplay?: boolean;
  onReset: () => void;
  onPlayAgain?: () => void;
  playAgainText?: string;
  onRewatch?: () => void;
  currentGameId: bigint;
  /** The game plays its own music (no Howl here). */
  skipMusic?: boolean;
  /** The game presents results itself (a result plaque on the stage instead of the shared modal). */
  hideResultsModal?: boolean;
}

export default function ImmersiveGameWindow({
  game,
  children,
  isLoading,
  isGameFinished,
  betAmount,
  payout,
  inReplayMode,
  isUserOriginalPlayer,
  showPNL,
  isGamePaused = false,
  lastPlayPaymentMode = null,
  showPlayAgainInReplay = false,
  onReset,
  onPlayAgain,
  playAgainText = "Play Again",
  onRewatch,
  currentGameId,
  skipMusic = false,
  hideResultsModal = false,
}: ImmersiveGameWindowProps) {
  const { usdMode, muteMusic, musicVolume } = usePlatformPrefs();

  // ── game music ──
  const audioRef = useRef<Howl | null>(null);
  useEffect(() => {
    if (skipMusic) return;
    const sound = new Howl({ src: [game.song || FALLBACK_SONG], loop: true, volume: musicVolume, mute: muteMusic });
    audioRef.current = sound;
    if (!muteMusic) sound.play();
    return () => {
      sound.unload();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.song, skipMusic]);
  useEffect(() => {
    audioRef.current?.volume(musicVolume);
  }, [musicVolume]);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.mute(muteMusic);
    if (!muteMusic && !a.playing()) a.play();
  }, [muteMusic]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {isGamePaused && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-2 bg-[#12181C]/75 p-4 backdrop-blur-xs">
          <h2 className="text-center text-xl font-semibold sm:text-3xl">Game paused</h2>
          <p className="mx-auto max-w-sm text-center text-sm text-muted-foreground sm:max-w-md">
            This game is paused for maintenance. Please check back soon.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#12181C]/75 backdrop-blur-xs">
          <p className="animate-pulse text-center text-lg font-semibold sm:text-xl">Loading...</p>
        </div>
      )}

      {!hideResultsModal && isGameFinished && betAmount !== null && payout !== null && onPlayAgain && (
        <GameResultsModal
          key={currentGameId.toString()}
          isOpen={isGameFinished}
          payout={payout}
          betAmount={betAmount}
          usdMode={usdMode}
          apePrice={APE_PRICE_USD}
          isLoading={isLoading}
          gameTitle={game.title}
          onReset={onReset}
          onPlayAgain={onPlayAgain}
          playAgainButtonText={playAgainText}
          onRewatch={onRewatch}
          showPlayAgainOption={(!inReplayMode || showPlayAgainInReplay) && isUserOriginalPlayer && lastPlayPaymentMode !== "gp"}
          showRewatchOption={inReplayMode || isUserOriginalPlayer}
          showPNL={showPNL}
        />
      )}

      {children}
    </div>
  );
}
