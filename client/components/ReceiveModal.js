"use client";
import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

export default function ReceiveModal({ account, open, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    async function handleCopy() {
        if (!account) return;
        try { await navigator.clipboard.writeText(account); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4" onClick={onClose}>
            <div className="w-full max-w-xl bg-surface-card border border-white/[.08] rounded-2xl shadow-2xl p-6 animate-drop-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[15px] font-semibold text-ink-1">Receive Tokens</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-ink-3 hover:text-ink-1 hover:bg-white/[.06] transition-all cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
                <div className="text-[11px] text-ink-2 break-all p-3 bg-surface-input rounded-xl leading-relaxed mb-3 border border-white/[.06] font-mono">{account}</div>
                <p className="text-[11px] text-ink-3 mb-4 leading-relaxed">Share this address to receive TIP-20 tokens on Tempo Moderato (42431).</p>
                <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold cursor-pointer hover:bg-accent-hover transition-all">
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-ink-2 text-xs font-semibold border border-white/[.06] cursor-pointer hover:bg-surface-hover hover:text-ink-1 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
