// app/page.tsx
'use client';

import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import StakeNFT from './StakeNFT';
import StakeToken from './StakeToken';

export default function Home() {
  const { isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-16 space-y-12">
      {/* Cabeçalho */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-yellow-500">
          Welcome to the ENA Universe DApp
        </h1>
        <p className="text-lg text-yellow-300">
          Stake NFT  |  Stake $ENA Token
        </p>
      </div>

      {/* Imagem de destaque */}
      <div className="w-full max-w-3xl">
        <img
          src="/web3app.png"
          alt="ENA Universe Highlight"
          className="w-full rounded-xl shadow-2xl"
        />
      </div>

      {/* Botão gamificado: só enquanto não conectado */}
      {!isConnected && (
        <button
          onClick={() => connect()}
          className="btn-game"
        >
          Connect Wallet
        </button>
      )}

      {/* Se as duas seções só devem aparecer quando conectado */}
      {isConnected && (
        <section className="w-full max-w-3xl space-y-12">
          <div className="section-nft">
            <StakeNFT />
          </div>
          <div className="section-token">
            <StakeToken />
          </div>
        </section>
      )}
    </main>
  );
}
