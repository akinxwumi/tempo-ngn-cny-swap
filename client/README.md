# Tempo NGN/CNY Swap Client

This directory contains the client application for the Tempo NGN/CNY cross-border payment PoC. It provides a user-friendly interface for swapping NGN tokens to CNY tokens (and vice versa) using Tempo's native stablecoin DEX.

## Features

- **Single-Page Interface**: Simplified "Swap" view with no complex navigation.
- **Wallet Integration**: Seamless connection using Wagmi (MetaMask, etc.).
- **Auto-Faucet**: Automatically funds new users with test tokens (`NGNT`, `CNYT`) upon connection.
- **Transparent Pricing**: Displays real-time exchange rates, gas fees (paid in NGN/CNY), and total transaction costs.
- **Bidirectional Swaps**: Supports both Nigerian importers (NGN → CNY) and Chinese suppliers (CNY → NGN).

## Tempo SDKs Used

This project leverages the following libraries to interact with the Tempo blockchain:

- **`viem/tempo`**: Core SDK for Tempo-specific actions including:
  - Token operations (minting, transfers, approvals).
  - DEX interactions (swapping, quoting).
  - Chain definitions and address constants.
- **`wagmi`**: React hooks for wallet connection, account state, and transaction management, configured to work with the Tempo Moderato Testnet.

## Setup & Configuration

### 1. Installation

From the project root, install dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in this directory:

```bash
cp .env.example .env.local
```

You only need to configure the orchestrator key, which is used by the server-side faucet to fund new users. The token addresses are hardcoded in the application.

- `ORCHESTRATOR_PRIVATE_KEY`: Your wallet private key (must be funded with AlphaUSD/Testnet tokens).

### 3. Running Development Server

Start the application from the project root:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

