"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronDown, Copy, Wallet, LogOut } from "lucide-react";
import { isTempoChain } from "../lib/tempo";

function acctLabel(v) {
    return v ? `${v.slice(0, 6)}…${v.slice(-4)}` : "";
}

export default function Header({ account, chainHex, connecting, onConnect, onDisconnect }) {
    const onTempo = isTempoChain(chainHex);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    if (!mounted) return null;

    return (
        <header className="border-b border-white/[.04] sticky top-0 z-50 bg-surface-root/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto h-16 flex items-center justify-between px-4 sm:px-8">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent via-accent-hover to-violet-500 flex items-center justify-center font-bold text-[14px] text-white shadow-lg shadow-accent/20">
                        T
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[14px] font-bold text-ink-1 leading-tight">Tempo</span>
                        <span className="text-[9px] text-ink-3 uppercase tracking-wider">NGNT ⇄ CNYT</span>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2.5">
                    {/* Network pill */}
                    {account && (
                        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${onTempo
                            ? "text-success bg-success-dim border-success/20"
                            : "text-danger bg-danger-dim border-danger/20"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${onTempo ? "bg-success animate-pulse" : "bg-danger"}`} />
                            {onTempo ? "Moderato" : "Wrong Net"}
                        </div>
                    )}

                    {/* Wallet */}
                    <div className="relative" ref={ref}>
                        {account ? (
                            <>
                                <button
                                    onClick={() => setOpen(!open)}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-card border border-white/[.08] text-ink-1 text-[13px] font-medium cursor-pointer transition-all hover:bg-surface-elevated hover:border-white/[.12]"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-accent to-success" />
                                    <span className="hidden sm:inline">{acctLabel(account)}</span>
                                    <span className="sm:hidden">{account.slice(0, 4)}…{account.slice(-2)}</span>
                                    <ChevronDown size={13} className={`text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
                                </button>
                                {open && (
                                    <div className="absolute top-[calc(100%+6px)] right-0 w-[180px] bg-surface-elevated border border-white/[.08] rounded-xl shadow-2xl overflow-hidden animate-drop-in">
                                        <div className="p-1.5">
                                            <DDBtn icon={<LogOut size={13} />} label="Disconnect" onClick={() => { setOpen(false); onDisconnect(); }} danger />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onConnect}
                                disabled={connecting}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-[13px] font-semibold cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(91,127,255,.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:from-ink-3 disabled:to-ink-3"
                            >
                                <Wallet size={13} />
                                <span className="hidden sm:inline">{connecting ? "Connecting..." : "Connect"}</span>
                                <span className="sm:hidden">{connecting ? "..." : "Connect"}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function DDBtn({ icon, label, onClick, danger }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${danger
                ? "text-danger hover:bg-danger-dim"
                : "text-ink-2 hover:bg-surface-hover hover:text-ink-1"
                }`}
        >
            <span className="opacity-70">{icon}</span>
            {label}
        </button>
    );
}
