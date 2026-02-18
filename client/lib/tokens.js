/**
 * Derive a deterministic hue from an address string.
 * Two adjacent hues are used to create a gradient.
 */
function hueFromAddress(address) {
    let hash = 0;
    const s = address.toLowerCase();
    for (let i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ((hash % 360) + 360) % 360;
}

/** Tailwind-compatible `from-[…] to-[…]` gradient classes for a token. */
export function tokenGradient(address) {
    const h = hueFromAddress(address || "0x0");
    return `from-[hsl(${h},65%,55%)] to-[hsl(${(h + 25) % 360},60%,50%)]`;
}

/** First letter of the symbol, or "?" */
export function tokenShort(symbol) {
    if (!symbol) return "?";
    return symbol.charAt(0).toUpperCase();
}
