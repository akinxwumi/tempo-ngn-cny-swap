"use client";
import { useState, useCallback, useEffect } from "react";
import { usePublicClient } from "wagmi";
import {
    getPublicClient,
    getBalances as fetchChainBalances,
    toUserError,
} from "../lib/tempo";

/**
 * Manages token balances for the connected account.
 * `tokens` is the array from useTokens — each item has { address, symbol, decimals }.
 */
export function useBalances(tokens, account, onTempo, faucetTick) {
    const publicClient = usePublicClient();
    const [balances, setBalances] = useState({});
    const [usdValues, setUsdValues] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // Build the tokenList shape that getBalances expects: { key, address }
    const refresh = useCallback(async (account) => {
        if (!account || tokens.length === 0) {
            setBalances({});
            setUsdValues({});
            return;
        }
        try {
            setRefreshing(true);
            const client = publicClient || getPublicClient();
            // Use address as key for a flat lookup
            const list = tokens.map((t) => ({ key: t.address, address: t.address }));
            const raw = await fetchChainBalances(client, account, list);
            setBalances(raw);
            setUsdValues({});
            return raw;
        } catch (e) {
            setError(toUserError(e));
            return {};
        } finally {
            setRefreshing(false);
        }
    }, [tokens, publicClient]);

    useEffect(() => {
        if (!account || !onTempo || tokens.length === 0) {
            setBalances({});
            setUsdValues({});
            return;
        }
        refresh(account);
    }, [account, onTempo, tokens, refresh]);

    useEffect(() => {
        if (!account || !onTempo || !faucetTick || tokens.length === 0) return;

        let cancelled = false;
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        (async () => {
            for (let attempt = 0; attempt < 5; attempt += 1) {
                const latest = await refresh(account);
                if (cancelled) return;

                const hasAnyBalance = tokens.some((token) => {
                    const value = latest?.[token.address];
                    return typeof value === "bigint" && value > 0n;
                });
                if (hasAnyBalance) return;

                await wait(1500);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [account, onTempo, faucetTick, tokens, refresh]);

    return { balances, usdValues, refreshing, error, refresh };
}
