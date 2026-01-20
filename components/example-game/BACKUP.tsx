"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { getPayout, randomBytes, Game } from "@/lib/games";
import GameWindow from "@/components/GameWindow";
import ExampleGameWindow from "./ExampleGameWindow";
import ExampleGameSetupCard from "./ExampleGameSetupCard";

// import GameHistory from "@/components/history/GameHistory";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { apechain, GovernanceContract } from "@/lib/constants/contracts";
import {
    bytesToHex,
    encodeAbiParameters,
    formatEther,
    Hex,
    isAddress,
    parseEther,
    zeroAddress,
} from "viem";
import { useApePrice } from "@/hooks/useApePrice";
// import { client } from "@/components/thirdweb-client";
// import {
//     getContract,
//     prepareContractCall,
//     sendTransaction,
//     waitForReceipt,
// } from "thirdweb";
// import { useVRFFee } from "@/hooks/useVRFFee";
// import { increaseGas } from "@/lib/constants";
// import { useMaxBetAmount } from "@/hooks/useMaxBetAmount";
// import { useGameOngoing } from "@/context/GameOngoingContext";
import { toast } from "sonner";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useGetWalletBalance } from "@/hooks/useGetWalletBalance";
import { getStoredReferrer } from "@/lib/utils";
import { getUserProfile, UserProfile } from "@/lib/db/api";
import './example-game.styles.css'

interface ExampleGameComponentProps {
    game: Game;
}

const ExampleGameComponent: React.FC<ExampleGameComponentProps> = ({ game }) => {
    // Initializations
    const themeColorBackground = game.themeColorBackground;
    const router = useRouter();
    const searchParams = useSearchParams();
    const replayIdString = searchParams.get("id");
    const { balance: walletBalance } = useGetWalletBalance();
    const { setIsGameOngoing } = useGameOngoing();
    const [currentView, setCurrentView] = React.useState<0 | 1 | 2>(0); // 0: setup view, 1: ongoing view, 2: game over view

    // Contract related state and initializations

    // Get the game contract
    const GameContract = getContract({
        client: client,
        chain: apechain,
        address: game.gameAddress,
    });

    const activeAccount = useActiveAccount();
    const { price: apePrice } = useApePrice();
    const { maxBet, minBet } = useMaxBetAmount();

    const [referredBy, setReferredBy] = useState<string>(zeroAddress);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const referrer = await getStoredReferrer(activeAccount?.address);
            setReferredBy(referrer);

            if (activeAccount) {
                const profileData = await getUserProfile(activeAccount.address);
                setProfile(profileData);
            }
        };
        fetchData();
    }, [activeAccount]);

    const { data: isSingleGamePaused } = useReadContract({
        contract: GameContract,
        method: "function paused() external view returns (bool)",
        params: [],
        queryOptions: {
            refetchInterval: 3000,
        },
    });

    const { data: isAllGamesPaused } = useReadContract({
        contract: GovernanceContract,
        method: "function paused() external view returns (bool)",
        params: [],
        queryOptions: {
            refetchInterval: 3000,
        },
    });

    const isGamePaused = useMemo(() => {
        return isSingleGamePaused || isAllGamesPaused;
    }, [isSingleGamePaused, isAllGamesPaused]);

    const { fee: vrfFee } = useVRFFee();
    const { usdMode } = useUserPreferences();



    // GAME RELATED DATA
    const [betAmount, setBetAmount] = React.useState<number>(0);
    const [numberOfSpins, setNumberOfSpins] = React.useState<number>(10);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [payout, setPayout] = React.useState<number | null>(null);
    const [currentSpinIndex, setCurrentSpinIndex] = React.useState<number>(0);
    const [gameOver, setGameOver] = React.useState<boolean>(false);
    const [autoSpin, setAutoSpin] = React.useState<boolean>(false);
    const [isSpinning, setIsSpinning] = React.useState<boolean>(false);

    const [currentGameId, setCurrentGameId] = useState<bigint>(
        replayIdString == null
            ? BigInt(bytesToHex(new Uint8Array(randomBytes(32))))
            : BigInt(replayIdString)
        // BigInt("109357697210935281042419344669933185914774982276013576941944426548356017276236")
    );

    useEffect(() => {
        if (replayIdString !== null) {
            if (replayIdString.length > 2) {
                setIsLoading(true);
                setCurrentGameId(BigInt(replayIdString));
            }
        }
    }, [replayIdString]);

    const [userRandomWord, setUserRandomWord] = useState<Hex>(
        bytesToHex(new Uint8Array(randomBytes(32)))
    );

    const { data: gameInfoRaw } = useReadContract({
        contract: GameContract,
        method:
            "function getGameInfo(uint256 gameId) returns ((address player, uint256 betAmountPerSpin, uint256 totalBetAmount, uint8[] num0, uint8[] num1, uint8[] num2, uint256 totalPayout, bool hasEnded, uint256 timestamp))",
        params: [currentGameId],
        queryOptions: {
            refetchInterval: 3000,
        },
    });

    type GameInfo = {
        player: string;
        betAmountPerSpin: bigint;
        totalBetAmount: bigint;
        num0: number[];
        num1: number[];
        num2: number[];
        totalPayout: bigint;
        hasEnded: boolean;
        timestamp: bigint;
    };

    const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

    useEffect(() => {
        if (gameInfoRaw) {
            // console.log("Game info raw:", gameInfoRaw);
            const gameInfoFormatted = gameInfoRaw as GameInfo;
            // console.log("Game info formatted:", gameInfoFormatted);
            if (gameInfoFormatted.hasEnded == true) {
                setIsLoading(false);
                setCurrentView(1); // Set to ongoing view
                setCurrentSpinIndex(0);
            }
            setGameInfo(gameInfoFormatted);
        }
    }, [gameInfoRaw]);

    // Helper functions

    const formatSpinResults = (): number[][] => {
        if (!gameInfo) return [];
        const results = gameInfo.num0.map((num, index) => {
            return [num, gameInfo.num1[index], gameInfo.num2[index]];
        });
        return results;
    };

    const getActiveBetAmount = (): number => {
        if (!gameInfo) {
            return 0;
        }
        return parseFloat(formatEther(gameInfo.betAmountPerSpin));
    };

    const getEXP = (): number => {
        if (!gameInfo) {
            return 0;
        }
        const betAmount = getActiveBetAmount() * gameInfo.num0.length;
        return Math.floor(betAmount);
    };

    const getTotalPayout = (): number => {
        if (!gameInfo) {
            return 0;
        }
        return parseFloat(formatEther(gameInfo.totalPayout));
    };

    const handleSpin = () => {
        if (!gameInfo) {
            return;
        }
        if (isSpinning == true) {
            return;
        }

        if (currentSpinIndex < gameInfo.num0.length) {
            if (gameOver) {
                setGameOver(false);
                setIsGameOngoing(true);
            }

            setIsSpinning(true);
        }
    };

    const handleSpinOver = (wonPayout: boolean, nextSpinDelay: number) => {
        if (!gameInfo) {
            return;
        }
        const betAmount = getActiveBetAmount();
        setIsSpinning(false);

        if (currentSpinIndex < gameInfo.num0.length - 1) {
            setPayout((prevPayout) => {
                // console.log("Prev Payout:", prevPayout);
                if (prevPayout == null) {
                    const newPayout =
                        (betAmount *
                            getPayout(
                                game.payouts,
                                gameInfo.num0[currentSpinIndex],
                                gameInfo.num1[currentSpinIndex],
                                gameInfo.num2[currentSpinIndex]
                            )) /
                        10_000;
                    // console.log("setting to: ", newPayout);
                    return newPayout;
                } else {
                    const newPayout =
                        prevPayout +
                        (betAmount *
                            getPayout(
                                game.payouts,
                                gameInfo.num0[currentSpinIndex],
                                gameInfo.num1[currentSpinIndex],
                                gameInfo.num2[currentSpinIndex]
                            )) /
                        10_000;
                    // console.log("setting to: ", newPayout);
                    return newPayout;
                }
            });
        } else {
            // console.log("Game Over!");
            setPayout(parseFloat(formatEther(gameInfo.totalPayout)));
            setCurrentView(2);
            if (wonPayout) {
                // add time for payout animation to end
                setTimeout(() => {
                    setGameOver(true);
                    setIsGameOngoing(false);
                    // setAutoSpin(false);
                    // play win sfx
                }, 1500);
            } else {
                setTimeout(() => {
                    setGameOver(true);
                    setIsGameOngoing(false);
                    // setAutoSpin(false);
                }, 800);
            }
        }

        setCurrentSpinIndex((prev) => prev + 1);
        if (autoSpin && currentSpinIndex < gameInfo.num0.length - 1) {
            setTimeout(() => {
                // handleSpin(); // having a problem with isSpinning being true here
                if (!gameInfo) {
                    return;
                }

                if (currentSpinIndex < gameInfo.num0.length) {
                    if (gameOver) {
                        setGameOver(false);
                        setIsGameOngoing(true);
                    }
                    setIsSpinning(true);
                }
            }, nextSpinDelay);
        }
    };

    const getSpinsLeft = (): number => {
        if (!gameInfo) {
            return 0;
        }
        return gameInfo.num0.length - currentSpinIndex;
    };

    const startGame = async (
        gameId?: bigint,
        randomWord?: Hex,
        betAmountToUse?: bigint
    ) => {
        if (!activeAccount) {
            toast.error("Please connect your wallet first.");
            return;
        }

        const realBetAmount = usdMode
            ? (betAmount || 0) / (apePrice || 1)
            : betAmount || 0;
        if (realBetAmount < minBet) {
            toast.error(
                `Bet amount must be greater than ${minBet.toLocaleString([], {
                    maximumFractionDigits: 1,
                })} APE`
            );
            return;
        }
        if (realBetAmount > maxBet) {
            toast.error(
                `Bet amount must be less than ${maxBet.toLocaleString([], {
                    maximumFractionDigits: 0,
                })} APE`
            );
            return;
        }

        const totalValue = parseEther(realBetAmount.toString()) + vrfFee;

        setIsLoading(true);
        setIsGameOngoing(true);

        // Use provided gameId and randomWord if available, otherwise use state values
        const gameIdToUse = gameId ?? currentGameId;
        const randomWordToUse = randomWord ?? userRandomWord;

        const encodedData = encodeAbiParameters(
            [
                { name: "gameId", type: "uint" },
                { name: "numSpins", type: "uint8" },
                { name: "ref", type: "address" },
                { name: "randomWord", type: "bytes32" },
            ],
            [
                gameIdToUse,
                numberOfSpins,
                isAddress(referredBy, { strict: false }) ? referredBy : zeroAddress,
                randomWordToUse,
            ]
        );

        try {
            const oldTransaction = prepareContractCall({
                contract: GameContract,
                method: "function play(address player, bytes gameData) payable",
                params: [activeAccount?.address || zeroAddress, encodedData],
                value: totalValue,
            });

            const transaction = await increaseGas(oldTransaction, activeAccount);

            const { transactionHash } = await sendTransaction({
                account: activeAccount,
                transaction,
            });

            if (!transactionHash) {
                console.error("Transaction failed!");
                toast.error("Transaction failed!");
                setIsLoading(false);
                setIsGameOngoing(false);
                return;
            }

            const receipt = await waitForReceipt({
                client: client,
                chain: apechain,
                transactionHash: transactionHash,
            });

            if (receipt) {
                if (receipt.status == "success") {
                    // console.log("Transaction complete!", receipt);
                    toast.success("Transaction complete!");
                } else {
                    console.error("Transaction failed!", receipt);
                    toast.error("Transaction failed!");
                    setIsLoading(false);
                    setIsGameOngoing(false);
                }
            } else {
                console.error("Something went wrong..", receipt);
                toast.info("Something went wrong..");
                setIsLoading(false);
                setIsGameOngoing(false);
            }
        } catch (error) {
            // First, check for the specific error conditions to ignore
            if (
                (error instanceof Error &&
                    error.message.includes("Transaction not found")) ||
                (typeof error === "string" && error.includes("Transaction not found"))
            ) {
                console.warn("Ignoring a known timeout error.");
                return; // Exit silently
            }

            // If the error was not ignored, handle it as a real failure
            console.error("An unexpected error occurred:", error);
            toast.error("An unexpected error occurred.");
            setIsLoading(false);
            setIsGameOngoing(false);
        }
    };

    const playAgain = async () => {
        // Define the new gameId first as a const
        const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))));
        const newUserWord = bytesToHex(new Uint8Array(randomBytes(32)));

        // Set the state for the new gameId and userRandomWord
        setCurrentGameId(newGameId);
        setUserRandomWord(newUserWord);

        // Reset game states (without generating new gameId/userRandomWord)
        resetGame(true);

        // Call startGame with the new gameId and userRandomWord
        await startGame(newGameId, newUserWord);
    };

    const rewatchGame = () => {
        // console.log("Replay button clicked");
        setCurrentView(1); // Set to ongoing view
        setCurrentSpinIndex(0);
        setPayout(null);
        setGameOver(false);
        setIsSpinning(false);
        setIsGameOngoing(false);
    };

    const resetGame = (isPlayingAgain: boolean = false) => {
        // console.log("Reset game");
        if (isPlayingAgain === false) {
            const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))));
            const newUserWord = bytesToHex(new Uint8Array(randomBytes(32)));
            setCurrentGameId(newGameId);
            setUserRandomWord(newUserWord);
        }
        setIsSpinning(false);
        setCurrentView(0); // Set to setup view
        setPayout(null);
        setGameOver(false);
        setCurrentSpinIndex(0);
        setGameInfo(null);
        setIsGameOngoing(false);

        if (replayIdString !== null) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("id");

            router.replace(`?${params.toString()}`, { scroll: false });
        }
    };

    const isUserOriginalPlayer = React.useMemo(() => {
        if (!activeAccount) {
            return false;
        }
        if (!gameInfo) {
            return false;
        }
        return (
            gameInfo.player.toLowerCase() === activeAccount.address.toLowerCase()
        );
    }, [activeAccount, gameInfo]);

    const shouldShowPNL = React.useMemo(() => {
        if (isUserOriginalPlayer) {
            // user is the original player - calculate PNL logic
            if (payout && payout > 1 && payout > betAmount) {
                // significant win
                return true;
            }
        }
        return false;
    }, [activeAccount, gameInfo, payout, betAmount, numberOfSpins]);

    const playAgainText = `Play Again (${numberOfSpins} More Spins)`

    return (
        <div>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-10">
                {/* Game Window */}
                <GameWindow
                    game={game}
                    currentGameId={currentGameId}
                    themeColorBackground={themeColorBackground}
                    isLoading={isLoading}
                    isGameFinished={gameOver}
                    onPlayAgain={playAgain}
                    playAgainText={playAgainText}
                    onRewatch={rewatchGame}
                    onReset={() => resetGame(false)}
                    betAmount={getActiveBetAmount()}
                    payout={payout}
                    expGained={getEXP()}
                    userAddress={activeAccount ? activeAccount.address : undefined}
                    inReplayMode={replayIdString !== null}
                    isUserOriginalPlayer={isUserOriginalPlayer}
                    showPNL={shouldShowPNL}
                    isGamePaused={isGamePaused}
                >
                    <SlotsGameWindow
                        game={game}
                        isSpinning={isSpinning}
                        currentSpinIndex={currentSpinIndex}
                        handleSpinOver={handleSpinOver}
                        gameCompleted={gameOver}
                        spinResults={formatSpinResults()} // number[][]; // Array of [index, index, index] for each spin outcome
                        betAmount={getActiveBetAmount()}
                        payoutAmount={getTotalPayout()} // This is the total payout for the entire game session
                        getSymbol={(index: number) => {
                            // Should return image path: game.slotItems[index]
                            return game.slotItems[index];
                        }}
                        getPayout={(index0: number, index1: number, index2: number) => {
                            // Returns payout factor
                            return getPayout(game.payouts, index0, index1, index2);
                        }}
                        nativePrice={apePrice}
                    />
                </GameWindow>

                {/* Game Setup Card */}
                <SlotsGameCard
                    game={game}
                    onPlay={async () => await startGame()}
                    onSpin={handleSpin}
                    onRewatch={rewatchGame}
                    onReset={() => resetGame(false)}
                    onPlayAgain={async () => await playAgain()}
                    playAgainText={playAgainText}
                    currentView={currentView}
                    betAmount={currentView == 0 ? betAmount : getActiveBetAmount()}
                    setBetAmount={setBetAmount}
                    numberOfSpins={
                        currentView == 0
                            ? numberOfSpins
                            : gameInfo
                                ? gameInfo.num0.length
                                : 0
                    }
                    setNumberOfSpins={setNumberOfSpins}
                    isLoading={isLoading}
                    payout={payout}
                    spinsLeft={getSpinsLeft()}
                    autoSpin={autoSpin}
                    setAutoSpin={setAutoSpin}
                    jackpotMultiplier={getPayout(game.payouts, 0, 0, 0) / 10000}
                    inReplayMode={replayIdString !== null}
                    account={activeAccount}
                    walletBalance={walletBalance}
                    playerAddress={gameInfo ? gameInfo.player : undefined}
                    isGamePaused={isGamePaused}
                    profile={profile || undefined}
                    maxBet={maxBet}
                    minBet={minBet}
                />
            </div>

            {/* Game Title and History */}
            <div className="mt-12 lg:mt-16">
                <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 className="w-6 h-6 md:w-8 md:h-8" />
                    <p className="font-medium text-xl sm:text-2xl">
                        {game.title} History
                    </p>
                </div>
                {/* <GameHistory
          gameAddress={game.gameAddress}
          gameId={game.id}
          numGames={20}
          currentGameId={currentGameId}
        /> */}
            </div>
        </div>
    );
};

export default ExampleGameComponent;