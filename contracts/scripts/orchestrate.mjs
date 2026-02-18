import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseUnits } from "viem";
import { Actions, Addresses, Tick } from "viem/tempo";
import { loadDotEnv, requiredEnv } from "../lib/env.mjs";
import { readAddressBook, writeAddressBook } from "../lib/addressBook.mjs";
import {
  createTempoClients,
  DEFAULT_FEE_TOKEN,
  DEFAULT_VALIDATOR_TOKEN,
  DEFAULT_RPC_URL,
} from "../lib/tempoClient.mjs";

const DECIMALS = 6;
const NGN_CURRENCY = "USD";
const CNY_CURRENCY = "USD";
const MINT_AMOUNT = parseUnits("1000000", DECIMALS);
const LIQUIDITY_TOPUP = parseUnits("1000", DECIMALS);
const TRANSFER_POLICY_ID = 1n;
const SEED_DEX = true;
const DEX_ORDER_AMOUNT = parseUnits("50000", DECIMALS);
const DEX_FAIR_PRICE = 1;
const DEX_SPREAD_BPS = 30;
const MAX_UINT256 = (1n << 256n) - 1n;

function roleAlreadyGranted(err) {
  const text = String(
    err?.shortMessage ||
    err?.message ||
    err?.details ||
    err?.reason ||
    "",
  ).toLowerCase();

  return (
    text.includes("already has role") ||
    text.includes("already granted") ||
    text.includes("role already")
  );
}

async function createTokensIfNeeded({
  walletClient,
  adminAddress,
  feeToken,
  ngnTokenAddress: existingNgnTokenAddress,
  cnyTokenAddress: existingCnyTokenAddress,
}) {
  let ngnTokenAddress = existingNgnTokenAddress || "";
  let cnyTokenAddress = existingCnyTokenAddress || "";

  if (!ngnTokenAddress) {
    const createdNgnToken = await Actions.token.createSync(walletClient, {
      admin: adminAddress,
      currency: NGN_CURRENCY,
      name: "Naira Test Token",
      symbol: "NGNT",
      feeToken,
    });
    ngnTokenAddress = createdNgnToken.token;
  }

  if (!cnyTokenAddress) {
    const createdCnyToken = await Actions.token.createSync(walletClient, {
      admin: adminAddress,
      currency: CNY_CURRENCY,
      name: "Yuan Test Token",
      symbol: "CNYT",
      feeToken,
    });
    cnyTokenAddress = createdCnyToken.token;
  }

  return { ngnTokenAddress, cnyTokenAddress };
}

async function grantIssuerIfNeeded({ walletClient, tokenAddress, accountAddress, feeToken }) {
  try {
    await Actions.token.grantRolesSync(walletClient, {
      token: tokenAddress,
      to: accountAddress,
      roles: ["issuer"],
      feeToken,
    });
  } catch (err) {
    if (!roleAlreadyGranted(err)) throw err;
  }
}

function pairAlreadyExists(err) {
  const text = String(
    err?.shortMessage ||
    err?.message ||
    err?.details ||
    err?.reason ||
    "",
  ).toLowerCase();
  return text.includes("pair exists") || text.includes("already exists");
}

async function createDexPairIfNeeded({ walletClient, baseTokenAddress, feeToken }) {
  try {
    await Actions.dex.createPairSync(walletClient, {
      base: baseTokenAddress,
      feeToken,
    });
  } catch (err) {
    if (!pairAlreadyExists(err)) throw err;
  }
}

async function approveDexSpender({
  walletClient,
  tokenAddress,
  dexAddress,
  feeToken,
}) {
  await Actions.token.approveSync(walletClient, {
    token: tokenAddress,
    spender: dexAddress,
    amount: MAX_UINT256,
    feeToken,
  });
}

async function placeDexOrderIfPossible({
  walletClient,
  baseTokenAddress,
  side,
  amount,
  tick,
  flipTick,
  feeToken,
}) {
  try {
    await Actions.dex.placeFlipSync(walletClient, {
      token: baseTokenAddress,
      type: side,
      amount,
      tick,
      flipTick,
      feeToken,
    });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..", "..");
  loadDotEnv(projectRoot);

  const privateKey = requiredEnv("ORCHESTRATOR_PRIVATE_KEY");
  const rpcUrl = DEFAULT_RPC_URL;
  const feeToken = DEFAULT_FEE_TOKEN;
  const validatorToken = DEFAULT_VALIDATOR_TOKEN;

  const sellPrice = DEX_FAIR_PRICE * (1 + DEX_SPREAD_BPS / 10000);
  const buyPrice = DEX_FAIR_PRICE * (1 - DEX_SPREAD_BPS / 10000);
  if (buyPrice <= 0) {
    throw new Error("Derived buy price is non-positive.");
  }

  const sellTick = Tick.fromPrice(String(sellPrice));
  const buyTick = Tick.fromPrice(String(buyPrice));

  const { account, walletClient } = createTempoClients({
    rpcUrl,
    privateKey,
  });

  const currentAddressBook = readAddressBook(projectRoot);
  const { ngnTokenAddress, cnyTokenAddress } = await createTokensIfNeeded({
    walletClient,
    adminAddress: account.address,
    feeToken,
    ngnTokenAddress: currentAddressBook.ngnTokenAddress,
    cnyTokenAddress: currentAddressBook.cnyTokenAddress,
  });
  if (
    ngnTokenAddress !== currentAddressBook.ngnTokenAddress ||
    cnyTokenAddress !== currentAddressBook.cnyTokenAddress
  ) {
    writeAddressBook(projectRoot, { ngnTokenAddress, cnyTokenAddress });
  }

  await grantIssuerIfNeeded({
    walletClient,
    tokenAddress: ngnTokenAddress,
    accountAddress: account.address,
    feeToken,
  });
  await grantIssuerIfNeeded({
    walletClient,
    tokenAddress: cnyTokenAddress,
    accountAddress: account.address,
    feeToken,
  });

  await Actions.token.changeTransferPolicySync(walletClient, {
    token: ngnTokenAddress,
    policyId: TRANSFER_POLICY_ID,
    feeToken,
  });
  await Actions.token.changeTransferPolicySync(walletClient, {
    token: cnyTokenAddress,
    policyId: TRANSFER_POLICY_ID,
    feeToken,
  });

  await Actions.token.mintSync(walletClient, {
    token: ngnTokenAddress,
    to: account.address,
    amount: MINT_AMOUNT,
    feeToken,
  });
  await Actions.token.mintSync(walletClient, {
    token: cnyTokenAddress,
    to: account.address,
    amount: MINT_AMOUNT,
    feeToken,
  });

  // Fee AMM only supports USD-denominated TIP-20 tokens.
  await Actions.amm.mintSync(walletClient, {
    to: account.address,
    userTokenAddress: ngnTokenAddress,
    validatorTokenAddress: validatorToken,
    validatorTokenAmount: LIQUIDITY_TOPUP,
    feeToken,
  });
  await Actions.amm.mintSync(walletClient, {
    to: account.address,
    userTokenAddress: cnyTokenAddress,
    validatorTokenAddress: validatorToken,
    validatorTokenAmount: LIQUIDITY_TOPUP,
    feeToken,
  });

  if (SEED_DEX) {
    const dexAddress = Addresses.stablecoinDex;

    await createDexPairIfNeeded({
      walletClient,
      baseTokenAddress: ngnTokenAddress,
      feeToken,
    });
    await createDexPairIfNeeded({
      walletClient,
      baseTokenAddress: cnyTokenAddress,
      feeToken,
    });

    await approveDexSpender({
      walletClient,
      tokenAddress: ngnTokenAddress,
      dexAddress,
      feeToken,
    });
    await approveDexSpender({
      walletClient,
      tokenAddress: cnyTokenAddress,
      dexAddress,
      feeToken,
    });
    await approveDexSpender({
      walletClient,
      tokenAddress: feeToken,
      dexAddress,
      feeToken,
    });

    const placements = [
      await placeDexOrderIfPossible({
        walletClient,
        baseTokenAddress: ngnTokenAddress,
        side: "sell",
        amount: DEX_ORDER_AMOUNT,
        tick: sellTick,
        flipTick: buyTick,
        feeToken,
      }),
      await placeDexOrderIfPossible({
        walletClient,
        baseTokenAddress: ngnTokenAddress,
        side: "buy",
        amount: DEX_ORDER_AMOUNT,
        tick: buyTick,
        flipTick: sellTick,
        feeToken,
      }),
      await placeDexOrderIfPossible({
        walletClient,
        baseTokenAddress: cnyTokenAddress,
        side: "sell",
        amount: DEX_ORDER_AMOUNT,
        tick: sellTick,
        flipTick: buyTick,
        feeToken,
      }),
      await placeDexOrderIfPossible({
        walletClient,
        baseTokenAddress: cnyTokenAddress,
        side: "buy",
        amount: DEX_ORDER_AMOUNT,
        tick: buyTick,
        flipTick: sellTick,
        feeToken,
      }),
    ];

    console.log(`DEX orders placed: ${placements.filter(Boolean).length}/${placements.length}`);
  }

  console.log("Orchestration complete.");
  console.log(`ORCHESTRATOR_ADDRESS=${account.address}`);
  console.log(`NGNT_TOKEN_ADDRESS=${ngnTokenAddress}`);
  console.log(`CNYT_TOKEN_ADDRESS=${cnyTokenAddress}`);
  console.log(`TRANSFER_POLICY_ID=${TRANSFER_POLICY_ID.toString()}`);
  if (SEED_DEX) {
    console.log(`DEX_ORDER_AMOUNT=${DEX_ORDER_AMOUNT.toString()}`);
    console.log(`DEX_ORDER_PRICE=${DEX_FAIR_PRICE}`);
    console.log(`DEX_SPREAD_BPS=${DEX_SPREAD_BPS}`);
  }
}

main().catch((err) => {
  console.error("Orchestration failed:", err);
  process.exit(1);
});
