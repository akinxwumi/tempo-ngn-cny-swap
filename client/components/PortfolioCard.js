"use client";
import { formatAmount } from "../lib/tempo";

export default function PortfolioCard({ tokens, balances, usdValues, loading }) {
    // Calculate total portfolio value
    const totalValue = tokens.reduce((sum, token) => {
        const usd = usdValues?.[token.address];
        if (typeof usd === "number" && Number.isFinite(usd)) {
            return sum + usd;
        }
        return sum;
    }, 0);

    return (
        <div className="rounded-2xl bg-surface-card border border-white/[.04] overflow-hidden">
            <div className="flex justify-between items-center px-5 pt-5 pb-4">
                <span className="text-[15px] font-semibold text-ink-1">Portfolio</span>
                <div className="text-right">
                    <p className="text-[11px] text-ink-3 uppercase tracking-wide mb-0.5">Total Value</p>
                    <p className="text-[15px] font-semibold text-ink-1 tabular-nums">
                        {loading ? "—" : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="px-5 py-8 text-center">
                    <div className="w-5 h-5 mx-auto mb-2 border-2 border-ink-3/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs text-ink-3">Loading balances…</p>
                </div>
            ) : (
                <div className="divide-y divide-white/[.04]">
                    {tokens.map((token) => {
                        const bal = balances[token.address] || 0n;
                        const usd = usdValues?.[token.address];
                        const formattedBalance = formatAmount(bal, token.decimals);

                        return (
                            <div
                                key={token.address}
                                className="px-5 py-3 flex items-center justify-between hover:bg-white/[.02] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                        <span className="text-[13px] font-semibold text-accent">
                                            {token.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-medium text-ink-1">{token.symbol}</p>
                                        <p className="text-[11px] text-ink-3">{token.name || token.symbol}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[13px] font-medium text-ink-1 tabular-nums">
                                        {formattedBalance}
                                    </p>
                                    <p className="text-[11px] text-ink-3 tabular-nums">
                                        {typeof usd === "number" && Number.isFinite(usd)
                                            ? `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : "—"}
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
