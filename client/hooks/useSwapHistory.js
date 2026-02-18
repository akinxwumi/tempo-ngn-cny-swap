"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { readActivity } from "../lib/sessionActivity";
const ALLOWED_TYPES = new Set(["swap"]);

function parseLegacyAmount(value) {
    const text = String(value || "").trim();
    if (!text) return { amount: "", symbol: "" };
    const parts = text.split(/\s+/);
    return {
        amount: parts[0] || "",
        symbol: parts[1] || "",
    };
}

function normalizeItem(item) {
    const [fromSymbol, toSymbol] = String(item?.direction || "").split(" → ");
    const legacySold = parseLegacyAmount(item?.amount);
    const legacyReceived = parseLegacyAmount(item?.received);

    return {
        ...item,
        sold: item?.sold || {
            amount: legacySold.amount,
            symbol: legacySold.symbol || fromSymbol || "",
        },
        received: item?.received && typeof item.received === "object"
            ? item.received
            : {
                amount: legacyReceived.amount,
                symbol: legacyReceived.symbol || toSymbol || "",
            },
    };
}

function normalize(items) {
    return (Array.isArray(items) ? items : [])
        .filter((i) => i && ALLOWED_TYPES.has(i.type))
        .map((i) => normalizeItem(i))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

export function useSwapHistory(account) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchIdRef = useRef(0);

    const refresh = useCallback(async () => {
        if (!account) {
            setHistory([]);
            return;
        }

        const id = ++fetchIdRef.current;
        setLoading(true);
        try {
            const items = normalize(readActivity(account));
            if (id === fetchIdRef.current) setHistory(items);
        } finally {
            if (id === fetchIdRef.current) setLoading(false);
        }
    }, [account]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { history, loading, refresh };
}
