"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameResultsModal from "./GameResultsModal";
import { Game } from "@/lib/games"; // Your game type

type GameWindowProps = {
    game: Game;
    isLoading: boolean;
    isGameFinished: boolean;
    customHeightMobile?: string; // optional custom height for the game window
    children: React.ReactNode; // game specific game window

    //game related data
    betAmount: number | null;
    payout: number | null;
    inReplayMode: boolean;
    isUserOriginalPlayer: boolean;
    showPNL: boolean;
    isGamePaused?: boolean;

    // game actions
    onReset: () => void;
    onPlayAgain?: () => void;
    playAgainText?: string;
    onRewatch?: () => void;
    currentGameId: bigint;
};

const fallbackSong = "/audio/songs/fallback-song.wav";

const GameWindow: React.FC<GameWindowProps> = ({
    game,
    isLoading,
    isGameFinished,
    customHeightMobile,
    children,

    betAmount,
    payout,
    inReplayMode = true,
    isUserOriginalPlayer = false,
    showPNL = false,
    isGamePaused = false,

    onReset,
    onPlayAgain,
    playAgainText = "Play Again",
    onRewatch,
    currentGameId
}) => {
    const audioRef = useRef<Howl | null>(null);
    const [muteMusic, setMuteMusic] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5);

    // Effect 1: Handles creating, changing, and cleaning up the audio source.
    useEffect(() => {
        // Create a new Howl object for the current game's song.
        const sound = new Howl({
            src: [game.song || fallbackSong],
            loop: true,
            volume: musicVolume, // Initialize with current volume
            mute: muteMusic, // Initialize with current mute state
        });

        audioRef.current = sound;

        // If not muted, attempt to play immediately
        if (!muteMusic) {
            // Howler handles the play promise internally.
            sound.play();
        } // Cleanup function: Runs when the component unmounts OR before the song changes.

        return () => {
            // Use unload() to stop the sound and free up resources.
            sound.unload();
            audioRef.current = null;
        };
    }, [game.song]); // Dependency: Re-run only when the song URL changes.

    // Effect 2: Synchronizes the audio volume with the global context.
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            // Howler uses a method to set volume
            audio.volume(musicVolume);
        }
    }, [musicVolume]); // Effect 3: Synchronizes the mute state.

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return; // Synchronize the mute state.

        audio.mute(muteMusic);

        // Ensure it starts playing if unmuted and hasn't started yet (handles autoplay policies)
        if (!muteMusic && !audio.playing()) {
            audio.play();
        }
    }, [muteMusic]);

    // The toggle function now ONLY updates the global state.
    // The useEffect hooks above will handle the actual audio manipulation.
    const muteSongToggle = () => {
        setMuteMusic(!muteMusic);
    };

    return (
        <div
            className={cn(
                "lg:basis-2/3 w-full rounded-[12px] border-[2.25px] sm:border-[3.75px] lg:border-[4.68px] border-[#2A3640] relative overflow-hidden",
            )}
        >

            {/* Game paused state */}
            {isGamePaused && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#12181C]/75 backdrop-blur-xs rounded-[8px] font-roboto p-4">
                    <h2 className="font-semibold text-xl sm:text-3xl text-center">
                        Game Paused
                    </h2>
                    <p className="text-sm text-muted-foreground text-center max-w-sm sm:max-w-md mx-auto">
                        The game contract is currently paused for maintenance or updates.
                        Please check back later.
                    </p>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[#12181C]/75 text-white backdrop-blur-xs rounded-[8px] font-roboto">
                    Loading...
                </div>
            )}

            {/* Game results modal */}
            {isGameFinished &&
                betAmount !== null &&
                payout !== null &&
                onReset &&
                onPlayAgain && (
                    <GameResultsModal
                        key={currentGameId.toString()}
                        isOpen={isGameFinished}
                        payout={payout}
                        betAmount={betAmount}
                        usdMode={false}
                        apePrice={1}
                        isLoading={isLoading}
                        gameTitle={game.title}
                        onReset={onReset}
                        onPlayAgain={onPlayAgain}
                        playAgainButtonText={playAgainText}
                        onRewatch={onRewatch}
                        showPlayAgainOption={!inReplayMode && isUserOriginalPlayer}
                        showRewatchOption={inReplayMode || isUserOriginalPlayer}
                        showPNL={showPNL}
                    />
                )}

            {/* Game window content */}
            {/* Background image / video */}
            {game.animatedBackground && game.animatedBackground !== "" ? (
                <video
                    src={game.animatedBackground}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    disablePictureInPicture={true}
                    className="w-full h-full object-cover rounded-[8px] pointer-events-none"
                />
            ) : (
                <Image
                    src={game.gameBackground}
                    alt="Game Background"
                    width={719}
                    height={719}
                    className="w-full h-full object-cover rounded-[8px] opacity-75"
                    style={{
                        minHeight: customHeightMobile ? customHeightMobile : "100%",
                    }}
                    priority
                />
            )}

            {/* Game specific content */}
            {children}

            {/* Sound toggle in bottom right */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 z-30 p-2 bg-[#151C21]/40 rounded-[8px] text-[#91989C]"
                onClick={muteSongToggle}
                title={muteMusic ? "Unmute sound" : "Mute sound"}
            >
                {muteMusic ? (
                    <VolumeX className="w-6 h-6" />
                ) : (
                    <Volume2 className="w-6 h-6" />
                )}
            </Button>
        </div>
    );
};

export default GameWindow;
