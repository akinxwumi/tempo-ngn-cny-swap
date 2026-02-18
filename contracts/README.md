# Tempo Token Orchestration Scripts

This directory contains Node.js scripts for managing the NGN/CNY test tokens on the Tempo Moderato Testnet. These scripts handle the initial setup, token minting, and DEX liquidity seeding required for the client application to function properly.

## Overview

The Tempo workflow for this PoC involves:
1.  **Orchestrate**: Deploys `NGNT` and `CNYT` tokens if they don't exist.
2.  **Mint**: Mints a large supply of tokens to the orchestrator wallet.
3.  **Seed DEX**: Creates a liquidity pool and places flip orders to ensure exchange rates are available.
4.  **Update Address Book**: Saves the permanent token addresses to `address.json` for consistent client use.

## Prerequisites

Ensure you have a funded wallet (AlphaUSD or Testnet tokens) for gas fees and that you've configured the root `.env` file:

```bash
# In project root
ORCHESTRATOR_PRIVATE_KEY=your_private_key_here
```

## Available Scripts

### Orchestrate (Run Once)

```bash
# Run from project root
npm run orchestrate
```

This script (`scripts/orchestrate.mjs`) performs the following actions:
- Creates `NGNT` and `CNYT` tokens (if not already present in `address.json`).
- Grants `issuer` role to the orchestrator.
- Sets transfer policy to allow transfers.
- Mints 1,000,000 `NGNT` and `CNYT` to the orchestrator.
- Adds liquidity to the validator pool.
- Creates/Checks the DEX pair for NGN/CNY (likely against AlphaUSD or direct pair depending on implementation).
- Places "flip" orders to provide initial liquidity at a set exchange rate.

### Check Pools

```bash
# Run from project root
npm run pool
```

This script (`scripts/checkPools.mjs`) checks the status of the liquidity pools and validator balances to ensure the swap functionality remains operational.

## File Structure

- `address.json`: Stores the deployed contract addresses. **Do not delete this file unless you intend to redeploy fresh tokens.**
- `scripts/`: Contains the executable `.mjs` files.
- `lib/`: Helper functions for Tempo SDK interactions and environment management.
