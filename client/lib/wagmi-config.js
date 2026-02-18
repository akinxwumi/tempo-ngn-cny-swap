import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { tempoModerato } from 'viem/chains';

// Create wagmi config
// Using only injected connector to avoid optional peer dependencies
export const config = createConfig({
    chains: [tempoModerato],
    connectors: [
        injected({
            shimDisconnect: true,
        }),
    ],
    multiInjectedProviderDiscovery: true,
    transports: {
        [tempoModerato.id]: http(),
    },
});
