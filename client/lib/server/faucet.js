import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, http, isAddress, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";
import { tempoActions } from "viem/tempo";

const DEFAULT_RPC_URL = "https://rpc.moderato.tempo.xyz";
const DEFAULT_FEE_TOKEN = "0x20c0000000000000000000000000000000000001";
const FAUCET_AMOUNT = "1000";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, "../..");
const PROJECT_DIR = path.resolve(CLIENT_DIR, "..");
const CONTRACTS_ADDRESS_PATH = path.join(PROJECT_DIR, "contracts", "address.json");

function getOrchestratorPrivateKey() {
  const privateKey = String(process.env.ORCHESTRATOR_PRIVATE_KEY || "").trim();
  if (!privateKey) {
    throw new Error("Missing ORCHESTRATOR_PRIVATE_KEY in client/.env or client/.env.local.");
  }

  const normalized = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("ORCHESTRATOR_PRIVATE_KEY must be a 32-byte hex string.");
  }

  return normalized;
}

function readAddressBook() {
  if (!fs.existsSync(CONTRACTS_ADDRESS_PATH)) {
    throw new Error("Missing contracts/address.json. Run `npm run orchestrate` first.");
  }

  const parsed = JSON.parse(fs.readFileSync(CONTRACTS_ADDRESS_PATH, "utf8"));
  const ngnTokenAddress = parsed?.ngnTokenAddress || "";
  const cnyTokenAddress = parsed?.cnyTokenAddress || "";

  if (!isAddress(ngnTokenAddress) || !isAddress(cnyTokenAddress)) {
    throw new Error("Invalid token addresses in contracts/address.json. Run `npm run orchestrate` again.");
  }

  return { ngnTokenAddress, cnyTokenAddress };
}

function createTempoClients(account) {
  const rpcUrl = process.env.TEMPO_RPC_URL || DEFAULT_RPC_URL;
  const publicClient = createClient({
    chain: tempoModerato,
    transport: http(rpcUrl),
  }).extend(tempoActions());
  const walletClient = createClient({
    account,
    chain: tempoModerato,
    transport: http(rpcUrl),
  }).extend(tempoActions());

  return { publicClient, walletClient };
}

async function getTokenTargetAmount(publicClient, token) {
  const metadata = await publicClient.token.getMetadata({ token });
  return parseUnits(FAUCET_AMOUNT, metadata.decimals);
}

async function mintFixedAmount({ walletClient, token, recipient, amount }) {
  await walletClient.token.mintSync({
    token,
    to: recipient,
    amount,
    feeToken: DEFAULT_FEE_TOKEN,
  });
  return amount;
}

export async function runFaucet(recipientAddress) {
  if (!isAddress(recipientAddress)) {
    throw new Error("Recipient address is invalid.");
  }

  const account = privateKeyToAccount(getOrchestratorPrivateKey());
  const { publicClient, walletClient } = createTempoClients(account);
  const { ngnTokenAddress, cnyTokenAddress } = readAddressBook();
  const [ngnTargetAmount, cnyTargetAmount] = await Promise.all([
    getTokenTargetAmount(publicClient, ngnTokenAddress),
    getTokenTargetAmount(publicClient, cnyTokenAddress),
  ]);

  const [ngnAmountMinted, cnyAmountMinted] = await Promise.all([
    mintFixedAmount({
      walletClient,
      token: ngnTokenAddress,
      recipient: recipientAddress,
      amount: ngnTargetAmount,
    }),
    mintFixedAmount({
      walletClient,
      token: cnyTokenAddress,
      recipient: recipientAddress,
      amount: cnyTargetAmount,
    }),
  ]);

  return {
    recipientAddress,
    ngnTokenAddress,
    cnyTokenAddress,
    ngnAmount: ngnAmountMinted.toString(),
    cnyAmount: cnyAmountMinted.toString(),
    skipped: false,
  };
}
