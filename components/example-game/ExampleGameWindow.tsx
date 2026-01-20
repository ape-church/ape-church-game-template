"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import useSound from 'use-sound';
import { Game } from "@/lib/games"; // Your game type

interface ExampleGameWindowProps {
    game: Game;
    isSpinning: boolean;
    currentSpinIndex: number;
    gameCompleted: boolean;
    spinResults: number[][];
    betAmount: number;
    payoutAmount: number;
}

const ExampleGameWindow: React.FC<ExampleGameWindowProps> = ({
    game,
    isSpinning,
    currentSpinIndex,
    gameCompleted,
    spinResults,
    betAmount,
    payoutAmount,
}) => {
    // TODO: get muteSfx, sfxVolume, muteMusic from useUserPreferences
    const muteSfx = false;
    const sfxVolume = 0.5;

    // SFX
    // The hook automatically keeps the volume and mute state synchronized.
    const [winSFX] = useSound('/audio/sfx/slots_small_win.wav', {
        volume: sfxVolume,
        soundEnabled: !muteSfx,
        interrupt: true // Allows the sound to restart if triggered again rapidly
    });
    const [loseSFX] = useSound('/audio/sfx/slots_lose.mp3', {
        volume: sfxVolume,
        soundEnabled: !muteSfx,
        interrupt: true // Allows the sound to restart if triggered again rapidly
    });


    // PAYOUT STATE
    const [payoutPopupImage, setPayoutPopupImage] = useState<string | null>(null); // Image for the popup
    const [payoutMessageText, setPayoutMessageText] = useState<string | null>(
        null
    ); // For the small text message
    const [payoutPopupText, setPayoutPopupText] = useState<string | null>(null);
    const [payoutPopupSubText, setPayoutPopupSubText] = useState<string | null>(
        null
    );
    const [payoutPopupPriceText, setPayoutPopupPriceText] = useState<
        string | null
    >(null);
    const [showPayoutPopup, setShowPayoutPopup] = useState(false);


    // simulate spin
    useEffect(() => {
        if (
            isSpinning == true &&
            spinResults.length > 0 &&
            currentSpinIndex < spinResults.length
        ) {
            setTimeout(() => {
                // TODO: simulate spin
                const spinOutcome = [
                    Math.floor(Math.random() * 6),
                    Math.floor(Math.random() * 6),
                    Math.floor(Math.random() * 6)
                ];
                setPayoutMessageText("You Won!");
                setPayoutPopupImage("/images/payout/win.png");
                setPayoutPopupText("You Won!");
                setPayoutPopupSubText("You Won!");
                setPayoutPopupPriceText("You Won!");
                setShowPayoutPopup(true);
            }, 1000);
        }
    }, [isSpinning, currentSpinIndex]);

    // simulate game completion
    useEffect(() => {
        if (gameCompleted) {
            const totalBet = betAmount * spinResults.length;

            if (totalBet <= 0) {
                console.warn("Total bet is zero or negative, cannot calculate payout.");
                return;
            }

            const multiplier = payoutAmount / totalBet;

            if (multiplier >= 1) {
                // play win sound
                winSFX();
            } else {
                // play lose sound
                loseSFX();
            }
        }
    }, [gameCompleted]);

    return (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-white">
            {/* Payout Popup Animation */}
            {showPayoutPopup && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="relative text-center p-8"
                    >
                        {/* image - nice win or big win */}
                        {payoutPopupImage && (
                            <Image
                                src={payoutPopupImage}
                                alt="payout popup image"
                                width={240}
                                height={240}
                                className="mx-auto w-[140px] h-[140px] sm:w-[240px] sm:h-[240px]"
                            />
                        )}
                        <h2
                            className="text-5xl sm:text-7xl font-bold"
                            style={{
                                color: game.themeColorBackground,
                                textShadow: `0 0 15px ${game.themeColorBackground}CC`,
                            }}
                        >
                            {payoutPopupText || ""}
                        </h2>
                        {payoutPopupSubText && (
                            <div className="mt-4 text-2xl text-foreground sm:text-3xl uppercase tracking-widest">
                                {payoutPopupSubText}
                            </div>
                        )}
                        {payoutPopupPriceText && (
                            <div className="text-lg sm:text-xl text-foreground mt-2 uppercase tracking-widest">
                                {payoutPopupPriceText}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* payout text at bottom of window */}
            {payoutMessageText && (
                <div className="absolute bottom-0 z-30 w-full p-2.5 bg-[#12181CBF] backdrop-blur-sm text-center">
                    <p
                        className="text-base sm:text-lg font-bold"
                        style={{ color: game.themeColorBackground }}
                    >
                        {payoutMessageText}
                    </p>
                </div>
            )}

            {/* Game Frame and Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                {/* Contained Background - note that this is currently implemented in the GameWindow component */}
                {/* {game.gameBackground && (
                    <div className="absolute inset-[14%] translate-y-[5%] z-1">
                        <Image
                            src={game.gameBackground}
                            alt="Slot Background"
                            fill
                            className="object-cover rounded-md"
                        />
                    </div>
                )} */}

                {/* Frame Overlay */}
                {/* <div className="absolute inset-0 z-20 pointer-events-none">
                    <Image
                        src={game.frameImage}
                        alt="Game Frame"
                        fill
                        className="object-contain"
                    />
                </div> */}

                {/* Game Content */}
                <div
                    // ref={gameContentRef} // ref - if needed
                    className="absolute inset-x-[21%] inset-y-[20%] mt-4 xs:mt-6 sm:mt-8 z-10 flex justify-around gap-1 sm:gap-2 lg:gap-1 aspect-square"
                >
                    Content Here
                </div>
            </div>
        </div>
    );
};

export default ExampleGameWindow;
