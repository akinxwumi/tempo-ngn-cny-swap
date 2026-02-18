import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";

const btnClass =
    "flex-1 flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-surface-card border border-white/[.04] text-left cursor-pointer transition-all hover:bg-white/[.04] hover:border-white/[.08] group";
const iconWrap =
    "w-9 h-9 rounded-full bg-surface-elevated border border-white/[.06] flex items-center justify-center shrink-0 transition-all group-hover:bg-accent-dim group-hover:border-accent/30";
const iconEl = "text-ink-2 group-hover:text-accent transition-colors";

export default function QuickActions({ onAction }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button className={btnClass} onClick={() => onAction?.("swap")}>
                <span className={iconWrap}>
                    <ArrowLeftRight size={16} className={iconEl} />
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink-2 leading-tight">Swap</p>
                    <p className="text-[10px] text-ink-3 leading-tight mt-0.5">Exchange tokens</p>
                </div>
            </button>

            <button className={btnClass} onClick={() => onAction?.("receive")}>
                <span className={iconWrap}>
                    <ArrowDownLeft size={16} className={iconEl} />
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink-2 leading-tight">Receive</p>
                    <p className="text-[10px] text-ink-3 leading-tight mt-0.5">Deposit tokens</p>
                </div>
            </button>

            <button className={btnClass} onClick={() => onAction?.("send")}>
                <span className={iconWrap}>
                    <ArrowUpRight size={16} className={iconEl} />
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink-2 leading-tight">Send</p>
                    <p className="text-[10px] text-ink-3 leading-tight mt-0.5">Transfer tokens</p>
                </div>
            </button>

            <button className={btnClass} onClick={() => onAction?.("withdraw")}>
                <span className={iconWrap}>
                    <Landmark size={16} className={iconEl} />
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink-2 leading-tight">Withdraw</p>
                    <p className="text-[10px] text-ink-3 leading-tight mt-0.5">Cash out to bank</p>
                </div>
            </button>
        </div>
    );
}
