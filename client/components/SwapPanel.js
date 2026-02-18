"use client";
import { useEffect, useState, useMemo } from "react";
import { ArrowDown, ChevronDown } from "lucide-react";
import { formatAmount } from "../lib/tempo";
import { useSwap } from "../hooks/useSwap";
import Banner from "./ui/Banner";

export default function SwapPanel({
    account, onTempo, swapTokens, balances, usdValues, loading,
    fromAddr, toAddr, onFromChange, onToChange, onSwapSuccess,
}) {
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    const fromToken = swapTokens.find((t) => t.address === fromAddr);
    const toToken = swapTokens.find((t) => t.address === toAddr);

    const {
        amount, setAmount,
        quoteOut, swapping, error, setError,
        status, setStatus, getQuote, swap,
    } = useSwap({
        account,
        onTempo,
        onSuccess: onSwapSuccess,
    });

    // Re-quote when tokens or amount change
    // Get quote based on user input, or use "1" for exchange rate when empty
    useEffect(() => {
        if (amount && Number(amount) > 0) {
            getQuote(fromToken, toToken, amount);
        } else {
            // Get quote with "1" for exchange rate display only
            getQuote(fromToken, toToken, "1");
        }
    }, [fromToken, toToken, amount, getQuote]);

    function handleFlip() {
        const tempFrom = fromAddr;
        const tempTo = toAddr;
        onFromChange(tempTo);
        onToChange(tempFrom);
        setAmount(""); // Clear amount when flipping
    }

    function handleMax() {
        const bal = balances[fromAddr];
        if (bal && fromToken) {
            const v = formatAmount(bal, fromToken.decimals).replace(/,/g, "");
            setAmount(v);
        }
    }

    function handleTokenSelect(tokenAddr, mode) {
        if (mode === 'from') {
            onFromChange(tokenAddr);
            setShowFromDropdown(false);
        } else {
            onToChange(tokenAddr);
            setShowToDropdown(false);
        }
    }

    return (
        <div className="relative">

            {/* Main Swap Card */}
            <div className="rounded-2xl bg-surface-card border border-white/[.04] p-6">
                {/* FROM Section */}
                <div className="mb-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-ink-3 font-medium uppercase tracking-wide">Sell</span>
                        {fromToken && (
                            <button
                                onClick={handleMax}
                                className="text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors"
                            >
                                Balance: {formatAmount(balances[fromAddr] || 0n, fromToken.decimals)} · MAX
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-input">
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[24px] font-bold text-ink-1 placeholder:text-ink-3/30 tabular-nums min-w-0"
                        />

                        {/* Token Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFromDropdown(!showFromDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-white/[.08] transition-all"
                            >
                                {fromToken ? (
                                    <>
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                            <span className="text-[11px] font-bold text-accent">
                                                {fromToken.symbol.slice(0, 2)}
                                            </span>
                                        </div>
                                        <span className="text-[14px] font-semibold text-ink-1">{fromToken.symbol}</span>
                                    </>
                                ) : (
                                    <span className="text-[14px] text-ink-3">Select</span>
                                )}
                                <ChevronDown size={16} className="text-ink-3" />
                            </button>

                            {/* Dropdown */}
                            {showFromDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface-elevated border border-white/[.08] shadow-2xl z-50 overflow-hidden animate-drop-in">
                                    <div className="p-1.5">
                                        {swapTokens.map((token) => {
                                            const isSelected = token.address === fromAddr;
                                            const isDisabled = token.address === toAddr;

                                            return (
                                                <button
                                                    key={token.address}
                                                    onClick={() => !isDisabled && handleTokenSelect(token.address, 'from')}
                                                    disabled={isDisabled}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${isDisabled
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-accent/10 border border-accent/20'
                                                            : 'hover:bg-surface-hover cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                                                        <span className="text-[11px] font-bold text-accent">
                                                            {token.symbol.slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[14px] font-semibold text-ink-1">{token.symbol}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Flip Button */}
                <div className="relative h-8 flex items-center justify-center -my-2">
                    <button
                        onClick={handleFlip}
                        className="w-10 h-10 rounded-full bg-surface-elevated border-2 border-surface-card text-ink-3 flex items-center justify-center cursor-pointer transition-all hover:text-accent hover:border-accent/30 hover:bg-accent/5 hover:rotate-180 z-10"
                    >
                        <ArrowDown size={16} />
                    </button>
                </div>

                {/* TO Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-ink-3 font-medium uppercase tracking-wide">Receive</span>
                        {toToken && (
                            <span className="text-[11px] text-ink-3 tabular-nums">
                                Balance: {formatAmount(balances[toAddr] || 0n, toToken.decimals)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-input">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={amount && Number(amount) > 0 ? quoteOut : ""}
                            readOnly
                            className="flex-1 bg-transparent border-none outline-none text-[24px] font-bold text-ink-1 placeholder:text-ink-3/30 tabular-nums min-w-0"
                        />

                        {/* Token Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowToDropdown(!showToDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-white/[.08] transition-all"
                            >
                                {toToken ? (
                                    <>
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                                            <span className="text-[11px] font-bold text-success">
                                                {toToken.symbol.slice(0, 2)}
                                            </span>
                                        </div>
                                        <span className="text-[14px] font-semibold text-ink-1">{toToken.symbol}</span>
                                    </>
                                ) : (
                                    <span className="text-[14px] text-ink-3">Select</span>
                                )}
                                <ChevronDown size={16} className="text-ink-3" />
                            </button>

                            {/* Dropdown */}
                            {showToDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface-elevated border border-white/[.08] shadow-2xl z-50 overflow-hidden animate-drop-in">
                                    <div className="p-1.5">
                                        {swapTokens.map((token) => {
                                            const isSelected = token.address === toAddr;
                                            const isDisabled = token.address === fromAddr;

                                            return (
                                                <button
                                                    key={token.address}
                                                    onClick={() => !isDisabled && handleTokenSelect(token.address, 'to')}
                                                    disabled={isDisabled}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${isDisabled
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-success/10 border border-success/20'
                                                            : 'hover:bg-surface-hover cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center shrink-0">
                                                        <span className="text-[11px] font-bold text-success">
                                                            {token.symbol.slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[14px] font-semibold text-ink-1">{token.symbol}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quote Details */}
                {quoteOut && fromToken && toToken && (
                    <div className="mt-4 pt-4 border-t border-white/[.04]">
                        <div className="flex items-center justify-between text-[12px]">
                            <span className="text-ink-3">Exchange Rate</span>
                            <span className="text-ink-1 font-medium tabular-nums">
                                1 {fromToken.symbol} ≈ {quoteOut
                                    ? (amount && Number(amount) > 0
                                        ? (Number(quoteOut.replace(/,/g, "")) / Number(amount)).toFixed(3)
                                        : Number(quoteOut.replace(/,/g, "")).toFixed(3))
                                    : "—"} {toToken.symbol}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[12px] mt-2">
                            <span className="text-ink-3">Transaction Fee</span>
                            <span className="text-ink-1 font-medium">0.3%</span>
                        </div>
                    </div>
                )}

                {/* Banners */}
                <div className="mt-4">
                    <Banner type="error" text={error} onClose={() => setError("")} />
                    <Banner type={status.includes("completed") || status.includes("connected") ? "success" : "info"} text={status} onClose={() => setStatus("")} />
                </div>

                {/* Swap Button */}
                <div className="mt-5 flex justify-center">
                    <button
                        onClick={() => swap(fromToken, toToken)}
                        disabled={swapping || !amount || Number(amount) <= 0 || !fromToken || !toToken}
                        className="px-12 py-3.5 rounded-2xl bg-gradient-to-r from-accent to-accent-hover text-white text-[15px] font-bold cursor-pointer transition-all hover:shadow-[0_8px_30px_rgba(91,127,255,.3)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:from-ink-3 disabled:to-ink-3"
                    >
                        {swapping && <span className="spinner" />}
                        {swapping ? "Swapping..." : "Swap"}
                    </button>
                </div>
            </div>
        </div>
    );
}
