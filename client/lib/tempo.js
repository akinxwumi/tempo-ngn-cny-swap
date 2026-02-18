import {
  createPublicClient,
  formatUnits,
  http,
  maxUint256,
  parseUnits,
} from "viem";
import { tempoModerato } from "viem/chains";
import { Addresses, tempoActions } from "viem/tempo";

export const TEMPO_CHAIN_ID = 42431;
export const TEMPO_CHAIN_HEX = "0xA5BF";
export const TEMPO_RPC_URL = "https://rpc.moderato.tempo.xyz";

export const DEX_ROUTER_ADDRESS = Addresses.stablecoinDex;
export const PATH_USD_ADDRESS = "0x20c0000000000000000000000000000000000000";
export const ALPHA_USD_ADDRESS = "0x20c0000000000000000000000000000000000001";
export const BETA_USD_ADDRESS = "0x20c0000000000000000000000000000000000002";

export const DEFAULT_FEE_TOKEN = ALPHA_USD_ADDRESS;
export const DEFAULT_VALIDATOR_TOKEN = ALPHA_USD_ADDRESS;
export const NGNT_TOKEN_ADDRESS = "0x20c000000000000000000000cd57e96cFA05903B";
export const CNYT_TOKEN_ADDRESS = "0x20C000000000000000000000F04fdd986372a6Cb";
export const TOKEN_DECIMALS = 6;

export function getPublicClient() {
  return createPublicClient({
    chain: tempoModerato,
    transport: http(TEMPO_RPC_URL),
  }).extend(tempoActions());
}

export function withTempoActions(client) {
  if (!client) return null;
  return client.extend(tempoActions());
}

export function formatAmount(value, decimals = TOKEN_DECIMALS) {
  try {
    const n = Number(formatUnits(value || 0n, decimals));
    if (Number.isNaN(n)) return "0.00";
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return "0.00";
  }
}

export function parseAmount(value, decimals = TOKEN_DECIMALS) {
  if (!value || Number.isNaN(Number(value))) return 0n;
  return parseUnits(String(value), decimals);
}

export function normalizeChainHex(chainHex) {
  if (!chainHex) return "";
  return String(chainHex).toLowerCase();
}

export function isTempoChain(chainHex) {
  return normalizeChainHex(chainHex) === normalizeChainHex(TEMPO_CHAIN_HEX);
}

export function getTokenList() {
  return [
    { key: "path", symbol: "PATHUSD", address: PATH_USD_ADDRESS },
    { key: "alpha", symbol: "ALPHAUSD", address: ALPHA_USD_ADDRESS },
    { key: "beta", symbol: "BETAUSD", address: BETA_USD_ADDRESS },
    { key: "ngnt", symbol: "NGNT", address: NGNT_TOKEN_ADDRESS },
    { key: "cnyt", symbol: "CNYT", address: CNYT_TOKEN_ADDRESS },
  ].filter((t) => t.address);
}

export async function getTokenMetadata(publicClient, token) {
  const client = withTempoActions(publicClient) || getPublicClient();
  return client.token.getMetadata({ token });
}

export async function getBalances(publicClient, account, tokenList) {
  const client = withTempoActions(publicClient) || getPublicClient();
  const balances = {};

  for (const token of tokenList) {
    try {
      const value = await client.token.getBalance({
        account,
        token: token.address,
      });
      balances[token.key] = value;
    } catch {
      balances[token.key] = 0n;
    }
  }
  return balances;
}

export async function quoteSwap(publicClient, tokenIn, tokenOut, amountIn) {
  const client = withTempoActions(publicClient) || getPublicClient();
  return client.dex.getSellQuote({
    tokenIn,
    tokenOut,
    amountIn,
  });
}

export async function getAllowance(publicClient, owner, token) {
  const client = withTempoActions(publicClient) || getPublicClient();
  return client.token.getAllowance({
    account: owner,
    spender: DEX_ROUTER_ADDRESS,
    token,
  });
}

export async function approveMax(walletClient, publicClient, account, token) {
  const client = withTempoActions(walletClient);
  if (!client) throw new Error("Wallet client unavailable.");

  const hash = await client.token.approve({
    account,
    token,
    spender: DEX_ROUTER_ADDRESS,
    amount: maxUint256,
    feeToken: DEFAULT_FEE_TOKEN,
  });
  const reader = withTempoActions(publicClient) || getPublicClient();
  return reader.waitForTransactionReceipt({ hash });
}

export async function executeSwap(
  walletClient,
  publicClient,
  account,
  tokenIn,
  tokenOut,
  amountIn,
  minOut = 0n,
) {
  const client = withTempoActions(walletClient);
  if (!client) throw new Error("Wallet client unavailable.");

  const hash = await client.dex.sell({
    account,
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut: minOut,
    feeToken: DEFAULT_FEE_TOKEN,
  });
  const reader = withTempoActions(publicClient) || getPublicClient();
  return reader.waitForTransactionReceipt({ hash });
}

export function toUserError(err) {
  const msg =
    err?.reason ||
    err?.shortMessage ||
    err?.details ||
    err?.info?.error?.message ||
    err?.message ||
    "Request failed";

  const text = String(msg);
  if (text.includes("User rejected")) return "Transaction rejected in wallet.";
  if (text.includes("insufficient funds")) return "Insufficient testnet funds for gas.";
  if (text.includes("invalid chain ID")) return "Wallet is on the wrong chain. Switch to Tempo 42431.";
  if (text.includes("missing revert data") || text.includes("could not coalesce")) {
    return "Tempo node rejected the call. Retry once; if it persists, check pair liquidity and transfer policy.";
  }
  return text;
}
