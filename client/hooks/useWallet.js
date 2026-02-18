"use client";
import { useCallback, useState, useEffect } from "react";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
    useConnectors
} from "wagmi";
import { tempoModerato } from "viem/chains";
import { toUserError } from "../lib/tempo";
import { useFaucet } from "./useFaucet";

export function useWallet() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connectAsync: wagmiConnect, error: connectError } = useConnect();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const connectors = useConnectors();

    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const {
        faucetTick,
        faucetError,
        faucetStatus,
        runFaucet,
        clearFaucetForAddress,
    } = useFaucet();

    const chainHex = chainId ? `0x${chainId.toString(16)}` : "";
    const onTempo = chainId === tempoModerato.id;

    useEffect(() => {
        if (faucetError) setError(faucetError);
    }, [faucetError]);

    useEffect(() => {
        setStatus(faucetStatus || "");
    }, [faucetStatus]);

    // Handle connect errors
    useEffect(() => {
        if (connectError) {
            setError(toUserError(connectError));
        }
    }, [connectError]);

    const connect = useCallback(async () => {
        try {
            setError("");
            setStatus("");

            // Use any ready connector (do not prefer MetaMask).
            const connector =
                connectors.find((c) => c?.ready !== false && !String(c?.name || "").toLowerCase().includes("metamask")) ||
                connectors.find((c) => c?.ready !== false) ||
                connectors[0];
            if (!connector) {
                throw new Error("No wallet connector available. Install MetaMask or a compatible wallet.");
            }
            if (connector.ready === false) {
                throw new Error("Wallet connector is not ready. Unlock or enable your wallet extension.");
            }

            // Connect to wallet
            const result = await wagmiConnect({ connector });

            // Switch to Tempo network if needed
            const connectedChainId = result?.chainId ?? chainId;
            if (connectedChainId && connectedChainId !== tempoModerato.id) {
                await switchChain({ chainId: tempoModerato.id });
            }

            const connectedAddress = result?.accounts?.[0] || address || "";
            if (connectedAddress) {
                await runFaucet(connectedAddress);
            } else {
                setStatus("Wallet connected.");
            }
        } catch (e) {
            setError(toUserError(e));
        }
    }, [wagmiConnect, connectors, chainId, switchChain, runFaucet, address]);

    const disconnect = useCallback(() => {
        clearFaucetForAddress(address);
        wagmiDisconnect();
        setStatus("");
        setError("");
    }, [wagmiDisconnect, address, clearFaucetForAddress]);

    // Auto-switch to Tempo network when connected to wrong network
    useEffect(() => {
        if (isConnected && chainId && chainId !== tempoModerato.id) {
            switchChain({ chainId: tempoModerato.id }).catch((e) => {
                setError(toUserError(e));
            });
        }
    }, [isConnected, chainId, switchChain]);

    return {
        account: address || "",
        chainHex,
        onTempo,
        connecting: isConnecting,
        error,
        setError,
        status,
        setStatus,
        faucetTick,
        connect,
        disconnect,
    };
}
