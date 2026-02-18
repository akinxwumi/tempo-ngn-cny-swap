"use client";
import { useEffect, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import {
    getPublicClient,
    getTokenMetadata,
    getTokenList,
} from "../lib/tempo";

export function useTokens(account, onTempo) {
    const publicClient = usePublicClient();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTokens = useCallback(async () => {
        if (!account) {
            setTokens([]);
            return;
        }

        const client = publicClient || getPublicClient();

        setLoading(true);
        try {
            const fixedTokens = getTokenList().map((t) => ({
                address: t.address,
                symbol: t.symbol,
                name: t.symbol,
            }));

            const resolved = await Promise.all(
                fixedTokens.map(async (t) => {
                    const metadata = await getTokenMetadata(client, t.address).catch(() => null);
                    return {
                        address: t.address,
                        name: metadata?.name || t.name,
                        symbol: metadata?.symbol || t.symbol,
                        decimals: Number(metadata?.decimals) || 6,
                        logoUrl: `https://tokenlist.tempo.xyz/icon/42431/${String(t.address).toLowerCase()}`,
                    };
                }),
            );

            const sorted = resolved
                .sort((a, b) => a.symbol.localeCompare(b.symbol));
            setTokens(sorted);
        } catch {
            setTokens([]);
        } finally {
            setLoading(false);
        }
    }, [account, publicClient]);

    useEffect(() => {
        if (account && onTempo) {
            fetchTokens();
        } else {
            setTokens([]);
        }
    }, [account, onTempo, fetchTokens]);

    return { tokens, loading, refetch: fetchTokens };
}
