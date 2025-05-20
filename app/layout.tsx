'use client';

import './globals.css';
import { ReactNode } from 'react';
import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { soneium } from './utils/chains';

const { chains, provider } = configureChains([soneium], [publicProvider()]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  provider,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>
      </body>
    </html>
  );
}
