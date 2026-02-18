"use client";
import { RefreshCw } from "lucide-react";
import { formatAmount } from "../lib/tempo";
import { tokenGradient, tokenShort } from "../lib/tokens";
import { useState } from "react";

const rowPalettes = [
    { amount: "text-emerald-400", badgeBg: "bg-emerald-400/10", badgeText: "text-emerald-400" },
    { amount: "text-amber-400", badgeBg: "bg-amber-400/10", badgeText: "text-amber-400" },
    { amount: "text-accent", badgeBg: "bg-accent-dim", badgeText: "text-accent" },
    { amount: "text-sky-400", badgeBg: "bg-sky-400/10", badgeText: "text-sky-400" },
];

export default function Portfolio({
    tokens, balances, usdValues, refreshing, loading, onRefresh,
}) {
    const totalUsd = tokens.reduce((sum, t) => {
        const v = usdValues?.[t.address];
        return typeof v === "number" && Number.isFinite(v) ? sum + v : sum;
    }, 0);

    return (
        <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-white/[.04]">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-ink-3 uppercase tracking-wide font-medium">Total Balance</span>
                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="p-1 rounded text-ink-3 hover:text-accent hover:bg-accent-dim transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            <p className="text-3xl sm:text-[38px] font-bold text-ink-1 tracking-tighter leading-none mb-1.5">
                <span className="text-lg sm:text-xl font-medium text-ink-3 mr-0.5">$</span>
                {totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-ink-3">{tokens.length} tokens · Tempo Moderato</p>

            {loading ? (
                <div className="py-10 px-5 text-center">
                    <div className="w-5 h-5 mx-auto mb-2 border-2 border-ink-3/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs text-ink-3">Fetching portfolio from chain…</p>
                </div>
            ) : (
                <div className="mt-5 flex flex-col">
                {tokens.map((token, idx) => {
                    const bal = balances[token.address] || 0n;
                    const usd = usdValues?.[token.address];
                    const gradient = tokenGradient(token.address);
                    const short = tokenShort(token.symbol);
                    const palette = rowPalettes[idx % rowPalettes.length];

                    return (
                        <div key={token.address} className="flex items-center gap-3 px-1 sm:px-2 py-2.5 rounded-xl border border-white/[.04] transition-colors hover:bg-white/[.02] group">
                            <TokenAvatar token={token} palette={palette} gradient={gradient} short={short} />
                            <div className={`w-1 self-stretch rounded-full ${palette.badgeBg}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-ink-1 truncate">{token.symbol}</p>
                                <p className="text-[11px] text-ink-3">{token.name}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-[13px] font-semibold tabular-nums ${palette.amount}`}>{formatAmount(bal, token.decimals)}</p>
                                <p className="text-[11px] text-ink-3 tabular-nums">
                                    {typeof usd === "number" && Number.isFinite(usd)
                                        ? `≈ $${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : "≈ —"}
                                </p>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
        </div>
    );
}

function TokenAvatar({
    token, palette, gradient, short,
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className={`w-[34px] h-[34px] rounded-[10px] ${palette.badgeBg} relative overflow-hidden flex items-center justify-center text-[10px] font-bold ${palette.badgeText} shrink-0`}>
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${gradient}`} />
            {!imgError && token.logoUrl ? (
                <img
                    src={token.logoUrl}
                    alt={token.symbol}
                    className="relative w-5 h-5 rounded-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="relative">{short}</span>
            )}
        </div>
    );
}
