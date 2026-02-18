import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

export const DEFAULT_RPC_URL = "https://rpc.moderato.tempo.xyz";
export const DEFAULT_FEE_TOKEN = "0x20c0000000000000000000000000000000000001";
export const DEFAULT_VALIDATOR_TOKEN = "0x20c0000000000000000000000000000000000001";

export function createTempoClients({ rpcUrl, privateKey }) {
  const normalizedPrivateKey = privateKey.startsWith("0x")
    ? privateKey
    : `0x${privateKey}`;

  const account = privateKeyToAccount(normalizedPrivateKey);
  const transport = http(rpcUrl || DEFAULT_RPC_URL);

  const walletClient = createWalletClient({
    account,
    chain: tempoModerato,
    transport,
  });

  const publicClient = createPublicClient({
    chain: tempoModerato,
    transport,
  });

  return { account, walletClient, publicClient };
}

