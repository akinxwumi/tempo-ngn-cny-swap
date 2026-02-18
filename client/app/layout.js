import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata = {
  title: "NGNT ⇄ CNYT Swap",
  description:
    "Instant NGNT ⇄ CNYT stablecoin swaps on Tempo. Fast, low-cost cross-border payments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
