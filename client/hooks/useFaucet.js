"use client";

import { useCallback, useRef, useState } from "react";
import { toUserError } from "../lib/tempo";

export function useFaucet() {
  const [faucetTick, setFaucetTick] = useState(0);
  const [faucetError, setFaucetError] = useState("");
  const [faucetStatus, setFaucetStatus] = useState("");
  const faucetDoneRef = useRef(new Set());
  const faucetPendingRef = useRef(new Set());

  const clearFaucetForAddress = useCallback((walletAddress) => {
    const key = String(walletAddress || "").toLowerCase();
    if (!key) return;
    faucetDoneRef.current.delete(key);
    faucetPendingRef.current.delete(key);
  }, []);

  const runFaucet = useCallback(async (walletAddress) => {
    const key = String(walletAddress || "").toLowerCase();
    if (!key) return false;
    if (faucetDoneRef.current.has(key) || faucetPendingRef.current.has(key)) return false;

    faucetPendingRef.current.add(key);
    setFaucetError("");
    setFaucetStatus("Funding wallet with 1000 NGNT + 1000 CNYT...");

    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Faucet failed.");
      }

      faucetDoneRef.current.add(key);
      setFaucetStatus("Wallet funded.");
      setFaucetTick((value) => value + 1);
      return true;
    } catch (error) {
      setFaucetError(toUserError(error));
      setFaucetStatus("");
      return false;
    } finally {
      faucetPendingRef.current.delete(key);
    }
  }, []);

  return {
    faucetTick,
    faucetError,
    setFaucetError,
    faucetStatus,
    setFaucetStatus,
    runFaucet,
    clearFaucetForAddress,
  };
}
