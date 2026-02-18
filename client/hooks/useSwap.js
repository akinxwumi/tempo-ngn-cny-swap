"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { Actions, Addresses } from 'viem/tempo'
import { Hooks } from "wagmi/tempo";
import {
    formatAmount,
    getAllowance,
    getPublicClient,
    parseAmount,
    toUserError,
} from "../lib/tempo";
import { addActivity, getExplorerReceiptUrl } from "../lib/sessionActivity";

function formatDisplayAmount(value) {
    const n = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(n)) return String(value || "");
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatRate(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return "";
    const rate = numerator / denominator;
    return rate.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function waitForReceiptNoTimeout(client, hash) {
    for (; ;) {
        try {
            const receipt = await client.getTransactionReceipt({ hash });
            if (receipt) return receipt;
        } catch {
            // keep polling until receipt is available
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

export function useSwap({ account, onTempo, onSuccess }) {
    const [amount, setAmount] = useState("");
    const [quoteOut, setQuoteOut] = useState("");
    const [quoteRaw, setQuoteRaw] = useState(0n);
    const [quoteRequest, setQuoteRequest] = useState({
        fromToken: null,
        toToken: null,
        value: "",
        side: "sell",
    });
    const [swapping, setSwapping] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const lockRef = useRef(false);
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const sell = Hooks.dex.useSell();
    const buy = Hooks.dex.useBuy();

    const hasQuoteInput = Boolean(
        quoteRequest.fromToken &&
        quoteRequest.toToken &&
        quoteRequest.value &&
        Number(quoteRequest.value) > 0,
    );

    const sellAmountIn = useMemo(() => {
        if (!hasQuoteInput || quoteRequest.side !== "sell") return 0n;
        return parseAmount(quoteRequest.value, quoteRequest.fromToken.decimals);
    }, [hasQuoteInput, quoteRequest]);

    const buyAmountOut = useMemo(() => {
        if (!hasQuoteInput || quoteRequest.side !== "buy") return 0n;
        return parseAmount(quoteRequest.value, quoteRequest.toToken.decimals);
    }, [hasQuoteInput, quoteRequest]);

    const { data: sellQuote, error: sellQuoteError } = Hooks.dex.useSellQuote({
        tokenIn: quoteRequest.fromToken?.address,
        tokenOut: quoteRequest.toToken?.address,
        amountIn: sellAmountIn,
        query: { enabled: hasQuoteInput && quoteRequest.side === "sell" },
    });

    const { data: buyQuote, error: buyQuoteError } = Hooks.dex.useBuyQuote({
        tokenIn: quoteRequest.fromToken?.address,
        tokenOut: quoteRequest.toToken?.address,
        amountOut: buyAmountOut,
        query: { enabled: hasQuoteInput && quoteRequest.side === "buy" },
    });

    useEffect(() => {
        if (!hasQuoteInput) {
            setQuoteOut("");
            setQuoteRaw(0n);
            return;
        }

        const activeError = quoteRequest.side === "buy" ? buyQuoteError : sellQuoteError;
        if (activeError) {
            setQuoteOut("");
            setQuoteRaw(0n);
            setError(toUserError(activeError));
            return;
        }

        const activeQuote = quoteRequest.side === "buy" ? buyQuote : sellQuote;
        if (typeof activeQuote === "bigint") {
            setQuoteRaw(activeQuote);
            const decimals = quoteRequest.side === "buy"
                ? quoteRequest.fromToken.decimals
                : quoteRequest.toToken.decimals;
            setQuoteOut(formatAmount(activeQuote, decimals));
        }
    }, [hasQuoteInput, quoteRequest, sellQuote, buyQuote, sellQuoteError, buyQuoteError]);

    const getQuote = useCallback((fromToken, toToken, value, side = "sell") => {
        if (!fromToken || !toToken || !value || Number(value) <= 0) {
            setQuoteOut("");
            setQuoteRaw(0n);
            return;
        }
        setQuoteRequest({ fromToken, toToken, value, side });
    }, []);

    const swap = useCallback(async (fromToken, toToken, side = "sell") => {
        if (lockRef.current) return;
        try {
            lockRef.current = true;
            setSwapping(true);
            setError("");
            setStatus("");
            if (!account) throw new Error("Connect wallet first.");
            if (!onTempo) throw new Error("Switch to Tempo Moderato Testnet.");
            if (!fromToken || !toToken) throw new Error("Select valid tokens.");
            if (!amount || Number(amount) <= 0) throw new Error("Enter a valid amount.");
            if (!quoteOut || quoteRaw <= 0n) throw new Error("No executable quote for this pair.");

            const slippageBps = 50n; // 0.5%
            const bpsDenominator = 10_000n;
            let swapTxHash = "";
            const reader = publicClient || getPublicClient();

            if (side === "buy") {
                const amountOut = parseAmount(amount, toToken.decimals);
                let latestAmountInQuote = quoteRaw;
                const initialMaxAmountIn = (quoteRaw * (bpsDenominator + slippageBps)) / bpsDenominator;
                const allowance = await getAllowance(reader, account, fromToken.address);
                const requiresApproval = initialMaxAmountIn > allowance;

                if (requiresApproval) {
                    setStatus(`Approving ${fromToken.symbol}…`);
                    const approveCall = Actions.token.approve.call({
                        token: fromToken.address,
                        spender: Addresses.stablecoinDex,
                        amount: initialMaxAmountIn,
                    });
                    const approveHash = await writeContractAsync(approveCall);
                    setStatus(`Approval submitted for ${fromToken.symbol}. Waiting for confirmation…`);
                    const approveReceipt = await waitForReceiptNoTimeout(reader, approveHash);
                    if (approveReceipt?.status !== "success") {
                        throw new Error(`Approval failed for ${fromToken.symbol}.`);
                    }
                }

                setStatus("Refreshing quote…");
                latestAmountInQuote = await Actions.dex.getBuyQuote(reader, {
                    tokenIn: fromToken.address,
                    tokenOut: toToken.address,
                    amountOut,
                });
                if (latestAmountInQuote <= 0n) throw new Error("No executable quote for this pair.");

                const maxAmountIn = (latestAmountInQuote * (bpsDenominator + slippageBps)) / bpsDenominator;
                const latestAllowance = await getAllowance(reader, account, fromToken.address);
                if (maxAmountIn > latestAllowance) {
                    throw new Error(`Allowance changed for ${fromToken.symbol}. Retry swap to approve updated amount.`);
                }

                setStatus("Submitting swap…");
                const hash = await buy.mutateAsync({
                    amountOut,
                    maxAmountIn,
                    tokenIn: fromToken.address,
                    tokenOut: toToken.address,
                });
                swapTxHash = hash || "";
            } else {
                const amountIn = parseAmount(amount, fromToken.decimals);
                const allowance = await getAllowance(reader, account, fromToken.address);
                const requiresApproval = amountIn > allowance;

                if (requiresApproval) {
                    setStatus(`Approving ${fromToken.symbol}…`);
                    const approveCall = Actions.token.approve.call({
                        token: fromToken.address,
                        spender: Addresses.stablecoinDex,
                        amount: amountIn,
                    });
                    const approveHash = await writeContractAsync(approveCall);
                    setStatus(`Approval submitted for ${fromToken.symbol}. Waiting for confirmation…`);
                    const approveReceipt = await waitForReceiptNoTimeout(reader, approveHash);
                    if (approveReceipt?.status !== "success") {
                        throw new Error(`Approval failed for ${fromToken.symbol}.`);
                    }
                }

                setStatus("Refreshing quote…");
                const latestAmountOutQuote = await Actions.dex.getSellQuote(reader, {
                    tokenIn: fromToken.address,
                    tokenOut: toToken.address,
                    amountIn,
                });
                if (latestAmountOutQuote <= 0n) throw new Error("No executable quote for this pair.");
                const minAmountOut = (latestAmountOutQuote * (bpsDenominator - slippageBps)) / bpsDenominator;

                setStatus("Submitting swap…");
                const hash = await sell.mutateAsync({
                    amountIn,
                    minAmountOut,
                    tokenIn: fromToken.address,
                    tokenOut: toToken.address,
                });
                swapTxHash = hash || "";
            }
            const finalHash = swapTxHash;

            if (finalHash) {
                setStatus(`Swap submitted: ${finalHash.slice(0, 10)}...`);
                const fromAmount = side === "buy" ? quoteOut : amount;
                const toAmount = side === "buy" ? amount : quoteOut;
                const fromAmountNum = Number(String(fromAmount || "").replace(/,/g, ""));
                const toAmountNum = Number(String(toAmount || "").replace(/,/g, ""));
                const rate = formatRate(toAmountNum, fromAmountNum);
                addActivity(account, {
                    hash: finalHash,
                    type: "swap",
                    direction: `${fromToken.symbol} → ${toToken.symbol}`,
                    memo: "Swap",
                    sold: {
                        amount: formatDisplayAmount(fromAmount),
                        symbol: fromToken.symbol,
                    },
                    received: {
                        amount: formatDisplayAmount(toAmount),
                        symbol: toToken.symbol,
                    },
                    rate: rate ? `1 ${fromToken.symbol} ≈ ${rate} ${toToken.symbol}` : "",
                    time: new Date().toLocaleString(),
                    explorerUrl: getExplorerReceiptUrl(finalHash),
                });

                // Confirm in background and refresh balances/history when mined.
                waitForReceiptNoTimeout(reader, finalHash)
                    .then((receipt) => {
                        if (receipt?.status === "success") {
                            setStatus("Swap confirmed!");
                            if (onSuccess) onSuccess();
                        } else {
                            setStatus("Swap failed on-chain.");
                        }
                    })
                    .catch(() => {
                        setStatus("Swap submitted. Confirmation pending.");
                    });
            }

            setAmount("");
            setQuoteOut("");
        } catch (e) {
            setError(toUserError(e));
            setStatus("");
        } finally {
            setSwapping(false);
            lockRef.current = false;
        }
    }, [account, onTempo, amount, onSuccess, quoteOut, quoteRaw, buy, publicClient, sell, writeContractAsync]);

    return {
        amount, setAmount,
        quoteOut, swapping, error, setError,
        status, setStatus, getQuote, swap,
    };
}
