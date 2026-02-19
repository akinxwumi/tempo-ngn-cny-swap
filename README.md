# NGN-CNY Payment PoC

We are experimenting with Tempo to see if it can materially improve the experience of NGN-CNY B2B payments. The goal is to test if Tempo's native stablecoin rails can offer a viable alternative to the high costs, delays, and friction of legacy SWIFT and traditional banking.

## Context

Trade between Nigeria and China exceeds $26B annually, but payments are still largely inefficient:
- **Cost**: Double conversion (NGN → USD → CNY) and bank fees cost businesses 3-5%.
- **Speed**: transfers typically take >= 1 day to settle.
- **Friction**: Bureaucratic hurdles (Forms M, tax clearance) add significant operational drag.

## The Experiment

We built a client-side Proof of Concept (PoC) to test an alternative flow:
1.  **Direct Swaps**: Using Tempo's native AMM to swap NGN stablecoins for CNY stablecoins.
2.  **Client-Side Orchestration**: The application handles all on-chain setup (minting tokens, seeding liquidity, funding wallets) automatically upon connection, removing the need for backend infrastructure.
3.  **Concept Tokens**: On the Tempo Moderato Testnet, we use NGN and CNY concept tokens (configured as USD-denominated to work with the current DEX constraints) to simulate the payment rails.

## How to Run

1.  **Install dependencies**:
    ```bash
    cd client
    npm install
    ```

2.  **Run the application**:
    ```bash
    npm run dev
    ```

3.  **Connect Wallet**:
    Open `http://localhost:3000` with a wallet configured for **Tempo Moderato Testnet** (Chain ID: 42431). The app will automatically fund your wallet and set up the environment.

## Findings

**Validated**:
- **Speed**: Settlement consistently occurs in under 60 seconds (vs. >= 1 day).
- **Cost**: On-chain fees are negligible (<0.5%) compared to banking rails.
- **UX**: Client-side automation proves that complex crypto operations can be abstracted away from the user.

**Constraints & Risks**:
- **USD Restriction**: Tempo's native DEX currently enforces USD-only pairs. Mainnet must support non-USD pairs for this to work without an intermediate USD hop.
- **Liquidity**: Market orders for NGN/CNY pairs will require deep liquidity to avoid slippage.
- **Off-Ramps**: The solution is technically sound, but practically relies on the existence of reliable fiat on/off-ramps in both Nigeria and China.
