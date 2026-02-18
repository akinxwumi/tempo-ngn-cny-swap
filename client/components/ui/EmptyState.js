import { Wallet } from "lucide-react";

export default function EmptyState({ title, message }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="mb-4 text-ink-3 opacity-30"><Wallet size={40} strokeWidth={1} /></div>
            <p className="text-[15px] font-semibold text-ink-2 mb-1.5">{title || "Connect your wallet"}</p>
            <p className="text-xs text-ink-3 max-w-[300px] leading-relaxed">
                {message || "Link your wallet to swap CNY/NGN. Built with Tempo."}
            </p>
        </div>
    );
}
