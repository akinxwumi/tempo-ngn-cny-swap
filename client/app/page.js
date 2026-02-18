"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useWallet } from "../hooks/useWallet";
import { useTokens } from "../hooks/useTokens";
import { useBalances } from "../hooks/useBalances";
import { useSwapHistory } from "../hooks/useSwapHistory";
import { clearActivity } from "../lib/sessionActivity";
import Header from "../components/Header";
import ActivityCard from "../components/ActivityCard";
import SwapPanel from "../components/SwapPanel";
import EmptyState from "../components/ui/EmptyState";
import Banner from "../components/ui/Banner";

import Loading from "../components/ui/Loading";

export default function Home() {
  const wallet = useWallet();
  const { tokens, loading: tokensLoading, refetch: refetchTokens } = useTokens(
    wallet.account,
    wallet.onTempo,
  );
  const { balances, usdValues, refreshing, refresh } = useBalances(
    tokens,
    wallet.account,
    wallet.onTempo,
    wallet.faucetTick,
  );
  const { history, loading: historyLoading, refresh: refreshHistory } = useSwapHistory(wallet.account);

  const swapTokens = useMemo(
    () => tokens.filter((t) => {
      const sym = String(t.symbol || "").toUpperCase();
      return sym === "NGNT" || sym === "CNYT";
    }),
    [tokens],
  );

  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const previousAccountRef = useRef("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (swapTokens.length < 2) {
      setFromAddr("");
      setToAddr("");
      return;
    }

    const hasFrom = swapTokens.some((t) => t.address === fromAddr);
    const hasTo = swapTokens.some((t) => t.address === toAddr);

    if (!hasFrom) setFromAddr(swapTokens[0].address);
    if (!hasTo) setToAddr(swapTokens[1].address);

    if (fromAddr && toAddr && fromAddr === toAddr) {
      setToAddr(swapTokens.find((t) => t.address !== fromAddr)?.address || swapTokens[1].address);
    }
  }, [swapTokens, fromAddr, toAddr]);

  useEffect(() => {
    const previousAccount = previousAccountRef.current;
    if (!wallet.account && previousAccount) {
      clearActivity(previousAccount);
    }
    previousAccountRef.current = wallet.account || "";
  }, [wallet.account]);

  function handleSwapSuccess() {
    refetchTokens();
    refresh(wallet.account);
    refreshHistory();
  }

  return (
    <div className="min-h-screen bg-surface-root">
      <Header
        account={mounted ? wallet.account : null}
        chainHex={wallet.chainHex}
        connecting={wallet.connecting}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      <main className="pt-0 pb-8">
        <div className="px-8 py-6 max-w-4xl mx-auto space-y-6">
          {wallet.status ? <Banner type="info" text={wallet.status} /> : null}
          {wallet.error ? <Banner type="error" text={wallet.error} /> : null}

          {!mounted || wallet.connecting ? (
            <Loading />
          ) : !wallet.account ? (
            <EmptyState />
          ) : tokensLoading ? (
            <Loading />
          ) : swapTokens.length < 2 ? (
            <EmptyState
              title="Tokens Not Configured"
              message="Set NGNT/CNYT token addresses in client/lib/tempo.js to enable swapping."
            />
          ) : (
            <>
              <SwapPanel
                account={wallet.account}
                onTempo={wallet.onTempo}
                swapTokens={swapTokens}
                balances={balances}
                usdValues={usdValues}
                loading={tokensLoading || refreshing}
                fromAddr={fromAddr}
                toAddr={toAddr}
                onFromChange={setFromAddr}
                onToChange={setToAddr}
                onSwapSuccess={handleSwapSuccess}
              />

              <ActivityCard
                items={history}
                label="Recent Swaps"
                total={history.length}
                loading={historyLoading}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
