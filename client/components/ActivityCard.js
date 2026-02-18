import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, ShieldCheck } from "lucide-react";

const typeConfig = {
    swap: { icon: ArrowLeftRight, color: "text-accent", bg: "bg-accent-dim" },
    send: { icon: ArrowUpRight, color: "text-amber-400", bg: "bg-amber-400/10" },
    receive: { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    approve: { icon: ShieldCheck, color: "text-sky-400", bg: "bg-sky-400/10" },
};

export default function ActivityCard({ items, label, total, loading }) {
    return (
        <div className="rounded-2xl bg-surface-card border border-white/[.04] overflow-hidden">
            <div className="flex justify-between items-center px-4 sm:px-5 pt-4 pb-3">
                <span className="text-sm font-semibold text-ink-1">{label}</span>
                <span className="text-[11px] text-ink-3">
                    {loading ? "Loading…" : total > 0 && `${total} transaction${total !== 1 ? "s" : ""}`}
                </span>
            </div>
            {loading ? (
                <div className="py-10 px-5 text-center">
                    <div className="w-5 h-5 mx-auto mb-2 border-2 border-ink-3/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs text-ink-3">Fetching history from chain…</p>
                </div>
            ) : items.length === 0 ? (
                <div className="py-10 px-5 text-center">
                    <ArrowLeftRight size={24} className="mx-auto text-ink-3 opacity-20 mb-2" />
                    <p className="text-xs text-ink-3">No transactions yet</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {items.map((item, idx) => {
                        const cfg = typeConfig[item.type] || typeConfig.swap;
                        const Icon = cfg.icon;
                        const soldAmount = item?.sold?.amount || "";
                        const soldSymbol = item?.sold?.symbol || "";
                        const receivedAmount = item?.received?.amount || "";
                        const receivedSymbol = item?.received?.symbol || "";
                        const [fromSymbol, toSymbol] = item.direction?.split(" → ") || [soldSymbol, receivedSymbol];

                        return (
                            <div key={`${item.hash}-${idx}`} className="flex items-start gap-3 px-4 sm:px-5 py-3.5 border-t border-white/[.04] transition-colors hover:bg-white/[.02]">
                                <div className={`w-[36px] h-[36px] rounded-[11px] ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                    <Icon size={15} className={cfg.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[13px] font-semibold text-ink-1">{fromSymbol}</span>
                                        <Icon size={12} className="text-ink-3" />
                                        <span className="text-[13px] font-semibold text-ink-1">{toSymbol}</span>
                                    </div>
                                    <div className="mt-1 space-y-0.5 text-[11px] tabular-nums">
                                        <p className="text-ink-3">
                                            Sold: <span className="text-ink-1 font-medium">{soldAmount || "0"} {soldSymbol}</span>
                                        </p>
                                        <p className="text-ink-3">
                                            Received: <span className="text-ink-1 font-medium">{receivedAmount || "0"} {receivedSymbol}</span>
                                        </p>
                                    </div>
                                    {item.rate ? (
                                        <p className="text-[10px] text-ink-3 mt-1">{item.rate}</p>
                                    ) : null}
                                </div>
                                <div className="text-right shrink-0">
                                    {item.explorerUrl ? (
                                        <a
                                            className="text-[10px] text-ink-3 whitespace-nowrap hover:text-accent hover:underline underline-offset-2 transition-colors"
                                            href={item.explorerUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="View on explorer"
                                        >
                                            {item.time || item.memo || "View receipt"}
                                        </a>
                                    ) : (
                                        <p className="text-[10px] text-ink-3 whitespace-nowrap">{item.time || item.memo || ""}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
