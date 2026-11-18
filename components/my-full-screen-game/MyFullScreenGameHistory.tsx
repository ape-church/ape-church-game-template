"use client";

/**
 * Below the fold: ImmersiveGameFrame's `below` slot, reached by scrolling or the stage's HISTORY pill. On ape.church
 * this is where the game's history table, leaderboard and promotions go; the stage itself stays clean.
 */

import React from "react";

export interface SessionRecord {
    id: bigint;
    /** Total bet (APE). */
    bet: number;
    payout: number;
    spins: number;
    gp: boolean;
}

const fmt = (n: number) => n.toLocaleString([], { maximumFractionDigits: 3 });

export default function MyFullScreenGameHistory({ sessions }: { sessions: SessionRecord[] }) {
    return (
        <section className="mx-auto w-full max-w-4xl">
            <h2 className="mb-1 text-xl font-bold">Your recent sessions</h2>
            <p className="mb-5 text-sm text-muted-foreground">
                Below the fold. On ape.church the platform puts game history and the leaderboard here.
            </p>
            {sessions.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-card/60 p-6 text-center text-sm text-muted-foreground">
                    No sessions yet. Buy some spins above.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-card/60">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Game</th>
                                <th className="px-4 py-3">Spins</th>
                                <th className="px-4 py-3 text-right">Bet</th>
                                <th className="px-4 py-3 text-right">Payout</th>
                                <th className="px-4 py-3 text-right">Replay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => (
                                <tr key={s.id.toString()} className="border-t border-white/5">
                                    <td className="px-4 py-3 font-mono text-xs">{`${s.id.toString(16).slice(0, 8)}...`}</td>
                                    <td className="px-4 py-3">{s.spins}</td>
                                    <td className="px-4 py-3 text-right">{s.gp ? "GP" : `${fmt(s.bet)} APE`}</td>
                                    <td className={`px-4 py-3 text-right font-semibold ${s.payout > s.bet ? "text-primary" : ""}`}>{fmt(s.payout)} APE</td>
                                    <td className="px-4 py-3 text-right">
                                        <a className="text-primary underline-offset-2 hover:underline" href={`?id=${s.id.toString()}`}>
                                            Watch
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
