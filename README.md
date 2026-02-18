# Tempo NGN ⇄ CNY Cross-Border B2B Payment PoC

Proof of concept experiment with Tempo blockchain for Nigeria ⇄ China B2B payments using NGN and CNY stablecoins. The goal is to validate whether Tempo can materially make NGN/CNY payments faster, cheaper, and more user-friendly than traditional payment rails (SWIFT, correspondent banking).

## Why Nigeria ⇄ China?

**The Problem: The Failed Government Solution**
Nigeria and China signed a $2.5 billion currency swap agreement to allow Nigerian businesses to pay Chinese suppliers in Naira. However, the result has been largely ineffective:
- Covers only 12% of trade volume.
- Persistent trade imbalance.
- Severe Naira depreciation.
- Bureaucratic hurdles (Form M, Tax clearance, etc.) causing 5-10 day delays.

**The Real Pain for Businesses**
A Nigerian retailer paying $50,000 to a Shenzhen manufacturer faces:
- **Currency Conversion Hell**: NGN → USD → CNY (double conversion fees).
- **High Costs**: 3-5% lost in conversion and bank fees ($1,750 - $2,500).
- **Delays**: 3-7 days for SWIFT transfers to clear.

## The Tempo Solution

Instead of broken government swaps or painful legacy rails, this PoC demonstrates:
- **Instant NGN → CNY swaps** via Tempo's native stablecoin DEX (<1 minute).
- **Direct Payments**: Receive `CNYT` tokens usable for payments.
- **Cost Efficiency**: <0.5% total cost (vs 5.5% traditional).
- **Gas in Stablecoins**: Pay fees in NGN, no native gas token required.

**Important testnet constraint:** Tempo's native stablecoin DEX and fee AMM currently accept **USD-denominated TIP-20 tokens only** so true NGN/CNY TIP-20s cannot be traded on the native DEX on testnet as of now.

**PoC limitation:** For now only USD-denominated TIP-20 tokens can be swapped on the native DEX. Once the DEX supports non‑USD exchanges, we can create true NGN/CNY tokens and swap them directly.

## Project Structure

- `contracts/`: Terminal orchestration scripts for deploying tokens and seeding liquidity.
- `client/`: Next.js application for the swap interface.

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy the example environment files:

```bash
cp .env.example .env
cp client/.env.example client/.env.local
```

**Root `.env` Configuration:**
You need a Tempo private key for the orchestrator (admin):
- `ORCHESTRATOR_PRIVATE_KEY`: Your wallet private key (must be funded with AlphaUSD/Testnet tokens). You can fund it with the Tempo [faucet](https://docs.tempo.xyz/quickstart/faucet?tab-1=fund-an-address)

### 3. Orchestrator Setup (Run Once)

Initialize the on-chain environment (create USD-denominated tokens, mint supply, seed liquidity):

```bash
npm run orchestrate
```
*This script will update `contracts/address.json` with the deployed token addresses.*

### 4. Client Configuration

Update `client/.env.local` with the token addresses generated in `contracts/address.json`:

```ini
NEXT_PUBLIC_NGNT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CNYT_TOKEN_ADDRESS=0x...
```

### 5. Run the Client

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the swap interface.

## Features

- **Auto-Faucet**: When a wallet connects, the client automatically triggers a server-side faucet to fund the user with `NGNT` and `CNYT`.
- **Bidirectional Swaps**: NGN → CNY and CNY → NGN.
- **Transparent Pricing**: Real-time display of exchange rates and fees.
