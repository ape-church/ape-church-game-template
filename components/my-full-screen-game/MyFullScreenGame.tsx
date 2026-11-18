"use client";

/**
 * Root of the full-screen example. Owns all state and the lifecycle functions every Ape Church game implements
 * (playGame, handleReset, handlePlayAgain, handleRewatch; currentView 0 / 1 / 2), exactly as the HUD example
 * (components/my-game/MyGame.tsx) does. Only the shell differs:
 *
 *   ImmersiveGameFrame            one viewport tall under the site nav; history goes `below` the fold
 *     ImmersiveGameWindow         music, loading / paused overlays, the shared results modal (no chrome)
 *       MyFullScreenGameStage     the kit's console + corner pills, mapped from this state
 *         MyFullScreenGameScene   your scene, laid out from the stage layout L
 *
 * See docs/FULL-SCREEN.md.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bytesToHex, type Hex } from "viem";
import { toast } from "sonner";
import { getPayout, randomBytes, type Game } from "@/lib/games";
import ImmersiveGameFrame from "@/components/shared/immersive/ImmersiveGameFrame";
import ImmersiveGameWindow from "@/components/shared/immersive/ImmersiveGameWindow";
import { useImmersiveFrameControls } from "@/components/shared/immersive/frameControls";
import { useGpPayment } from "@/components/shared/immersive/kit/useGpPayment";
import type { SlotStageLayout } from "@/components/shared/immersive/kit/SlotConsole";
import type { PaymentMode } from "@/components/shared/immersive/platform";
import MyFullScreenGameStage from "./stage/MyFullScreenGameStage";
import MyFullScreenGameScene from "./MyFullScreenGameScene";
import MyFullScreenGameHistory, { type SessionRecord } from "./MyFullScreenGameHistory";
import { DEMO_WALLET_BALANCE, MAX_BET_PER_SPIN, MIN_BET_PER_SPIN, SYMBOLS, myFullScreenGame } from "./myFullScreenGameConfig";

/** How long a spin turns before its result lands (ms). */
const SPIN_MS = 1000;
/** Pause between spins while auto spin is on (ms). */
const AUTO_GAP_MS = 650;

const newId = () => BigInt(bytesToHex(new Uint8Array(randomBytes(32))));
const newWord = (): Hex => bytesToHex(new Uint8Array(randomBytes(32)));

/**
 * Every spin's result for a session, derived from the game id (a stand-in so a replay of the same id shows the same
 * spins). On ape.church the contract's VRF result plays this part: the session's outcomes are read from the chain
 * ONCE, then the spins (and any rewatch or ?id= replay) play them back.
 */
function deriveSpins(gameId: bigint, n: number): number[][] {
    let seed = Number(gameId & BigInt(0xffffffff)) >>> 0;
    const rand = () => {
        // mulberry32
        seed = (seed + 0x6d2b79f5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return Array.from({ length: n }, () => [0, 1, 2].map(() => Math.floor(rand() * SYMBOLS.length)));
}

interface MyFullScreenGameProps {
    /** Passed by the template app page; omitted on the submissions preview site. */
    game?: Game;
}

export default function MyFullScreenGame({ game: gameProp }: MyFullScreenGameProps) {
    const game = gameProp ?? myFullScreenGame;
    const router = useRouter();
    const searchParams = useSearchParams();
    const replayIdString = searchParams.get("id");
    const inReplayMode = replayIdString !== null;

    // ── state ──
    const [walletBalance, setWalletBalance] = useState(DEMO_WALLET_BALANCE); // TODO: the wallet's balance on ape.church
    const [currentView, setCurrentView] = useState<0 | 1 | 2>(0); // 0 setup, 1 playing, 2 finished
    const [betPerSpin, setBetPerSpin] = useState(1); // APE, always (USD is display only)
    const [numberOfSpins, setNumberOfSpins] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [payout, setPayout] = useState<number | null>(null);
    const [spins, setSpins] = useState<number[][]>([]);
    const [currentSpinIndex, setCurrentSpinIndex] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);
    const [lastPlayPaymentMode, setLastPlayPaymentMode] = useState<PaymentMode | null>(null);
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const gp = useGpPayment();

    // Game id + random word: used to play and to replay (?id=...)
    const [currentGameId, setCurrentGameId] = useState<bigint>(() => (replayIdString ? BigInt(replayIdString) : newId()));
    const [userRandomWord, setUserRandomWord] = useState<Hex>(newWord);

    const spinsLeft = numberOfSpins - currentSpinIndex;
    const lastSpin = currentSpinIndex > 0 ? spins[currentSpinIndex - 1] : undefined;
    const lastWinX = lastSpin ? getPayout(game.payouts, lastSpin[0], lastSpin[1], lastSpin[2]) / 10_000 : 0;
    const totalBet = betPerSpin * numberOfSpins;

    // ── replay: ?id= loads a finished session and plays it back ──
    useEffect(() => {
        if (!replayIdString || replayIdString.length <= 2) return;
        setIsLoading(true);
        // TODO: on ape.church, read the session (bet, spins, random result) from the contract by id
        const t = setTimeout(() => {
            setSpins(deriveSpins(BigInt(replayIdString), numberOfSpins));
            setCurrentSpinIndex(0);
            setPayout(null);
            setCurrentView(1);
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replayIdString]);

    // ── lifecycle ──

    /** Buys the session: validate, send the transaction, read the result, start the game. */
    const playGame = async (gameId?: bigint, randomWord?: Hex) => {
        const id = gameId ?? currentGameId;
        const word = randomWord ?? userRandomWord;
        const payingGp = gp.active;
        if (!payingGp && totalBet > walletBalance) {
            toast.error("Not enough APE for this bet");
            return;
        }
        setIsLoading(true);
        try {
            // TODO: on ape.church, send this purchase and wait for its VRF result. The bet is APE in state; in GP mode
            // the platform charges gp.costOf(totalBet) GP instead.
            const purchase = { gameId: id, userRandomWord: word, paymentMethod: gp.mode, betPerSpinApe: betPerSpin, spins: numberOfSpins };
            console.log("purchase", purchase);
            await new Promise((r) => setTimeout(r, 1000));
            if (!payingGp) setWalletBalance((b) => b - totalBet);
            setLastPlayPaymentMode(gp.mode);
            setSpins(deriveSpins(id, numberOfSpins));
            setCurrentSpinIndex(0);
            setPayout(null);
            setGameOver(false);
            setCurrentView(1);
            toast.success("Spins bought!");
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    /** One spin: turn the reels, land the next pre-drawn result, add its win, finish after the last. */
    const handleStateAdvance = () => {
        if (isSpinning || currentSpinIndex >= numberOfSpins || !spins[currentSpinIndex]) return;
        setIsSpinning(true);
        const result = spins[currentSpinIndex];
        setTimeout(() => {
            const win = (betPerSpin * getPayout(game.payouts, result[0], result[1], result[2])) / 10_000;
            const next = currentSpinIndex + 1;
            setIsSpinning(false);
            setCurrentSpinIndex(next);
            setPayout((p) => (p ?? 0) + win);
            if (next >= numberOfSpins) {
                const total = spins.reduce((s, r) => s + (betPerSpin * getPayout(game.payouts, r[0], r[1], r[2])) / 10_000, 0);
                setAutoSpin(false);
                setCurrentView(2);
                if (!inReplayMode) {
                    if (lastPlayPaymentMode !== "gp") setWalletBalance((b) => b + total);
                    setHistory((h) => [{ id: currentGameId, bet: totalBet, payout: total, spins: numberOfSpins, gp: lastPlayPaymentMode === "gp" }, ...h].slice(0, 10));
                }
                // let the last reels land before the results modal
                setTimeout(() => setGameOver(true), 900);
            }
        }, SPIN_MS);
    };

    /** Back to setup, as on first load: clear every round state, timer and replay param. */
    const handleReset = (isPlayingAgain = false) => {
        if (!isPlayingAgain) {
            setCurrentGameId(newId());
            setUserRandomWord(newWord());
        }
        setIsSpinning(false);
        setAutoSpin(false);
        setCurrentView(0);
        setPayout(null);
        setGameOver(false);
        setSpins([]);
        setCurrentSpinIndex(0);
        if (replayIdString !== null) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("id");
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    };

    /** A fresh session with the same bet: new id + word, reset, play. */
    const handlePlayAgain = async () => {
        const id = newId();
        const word = newWord();
        setCurrentGameId(id);
        setUserRandomWord(word);
        handleReset(true);
        await playGame(id, word);
    };

    /** Replays the last session's spins (same results), no transaction. */
    const handleRewatch = () => {
        setCurrentView(1);
        setCurrentSpinIndex(0);
        setPayout(null);
        setGameOver(false);
        setIsSpinning(false);
    };

    // ── auto spin: the game presses Spin once each spin has played out ──
    const advanceRef = useRef(handleStateAdvance);
    useEffect(() => {
        advanceRef.current = handleStateAdvance;
    });
    useEffect(() => {
        if (!autoSpin || currentView !== 1 || isSpinning || spinsLeft <= 0) return;
        const t = setTimeout(() => advanceRef.current(), currentSpinIndex === 0 ? 0 : AUTO_GAP_MS);
        return () => clearTimeout(t);
    }, [autoSpin, currentView, isSpinning, spinsLeft, currentSpinIndex]);

    // ── frame controls: Menu (site drawer), Games, History (scrolls below), Full screen ──
    const frame = useImmersiveFrameControls(true);

    const renderScene = useCallback(
        (L: SlotStageLayout) => (
            <MyFullScreenGameScene
                L={L}
                background={game.gameBackground}
                title={game.title}
                reels={lastSpin ?? [5, 5, 5]}
                spinning={isSpinning}
                lastWinX={lastWinX}
            />
        ),
        [game.gameBackground, game.title, lastSpin, isSpinning, lastWinX],
    );

    return (
        <ImmersiveGameFrame
            // continued (blurred) into the side pillars past maxAspect on ultrawide screens
            backdrop={game.gameBackground}
            maxAspect={2.4}
            below={<MyFullScreenGameHistory sessions={history} />}
        >
            <ImmersiveGameWindow
                game={game}
                currentGameId={currentGameId}
                // the console's big button shows a purchase in flight (it spins); the grey overlay is only for a replay load
                isLoading={isLoading && inReplayMode && currentView === 0}
                isGameFinished={gameOver}
                betAmount={totalBet}
                payout={payout}
                inReplayMode={inReplayMode}
                isUserOriginalPlayer={!inReplayMode}
                showPNL={(payout ?? 0) > totalBet}
                lastPlayPaymentMode={lastPlayPaymentMode}
                onReset={() => handleReset(false)}
                onPlayAgain={handlePlayAgain}
                playAgainText={`Play Again (${numberOfSpins} More Spins)`}
                onRewatch={handleRewatch}
            >
                <MyFullScreenGameStage
                    frame={frame}
                    scene={renderScene}
                    currentView={currentView}
                    isLoading={isLoading}
                    isSpinning={isSpinning}
                    betPerSpin={betPerSpin}
                    setBetPerSpin={setBetPerSpin}
                    minBet={MIN_BET_PER_SPIN}
                    maxBet={MAX_BET_PER_SPIN}
                    numberOfSpins={numberOfSpins}
                    setNumberOfSpins={setNumberOfSpins}
                    spinsLeft={spinsLeft}
                    payout={payout}
                    walletBalance={walletBalance}
                    gp={gp}
                    autoSpin={autoSpin}
                    onToggleAutoSpin={() => setAutoSpin((a) => !a)}
                    canPlayAgain={!inReplayMode && lastPlayPaymentMode !== "gp"}
                    onPlay={() => void playGame()}
                    onSpin={handleStateAdvance}
                    onPlayAgain={() => void handlePlayAgain()}
                    onRewatch={handleRewatch}
                    onReset={() => handleReset(false)}
                />
            </ImmersiveGameWindow>
        </ImmersiveGameFrame>
    );
}
