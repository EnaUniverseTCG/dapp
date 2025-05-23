// app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

// Carrega só no client para evitar problemas de SSR
const StakeNFT = dynamic(() => import('./StakeNFT'), { ssr: false });
const StakeToken = dynamic(() => import('./StakeToken'), { ssr: false });

export default function Home() {
  const { isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  // Troca para Soneium Mainnet, adicionando se necessário
  const switchToSoneium = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask não encontrada');
      return;
    }
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x74C' }], // 1868
      });
    } catch (err: any) {
      if (err.code === 4902) {
        // cadeia não adicionada ainda
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x74C',
            chainName: 'Soneium Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.soneium.org'],
            blockExplorerUrls: ['https://explorer.soneium.org'],
          }],
        });
      } else {
        alert('Erro ao trocar de rede: ' + err.message);
      }
    }
  };

  // Primeiro muda de rede, depois abre o modal de conexão
  const handleConnectClick = async () => {
    await switchToSoneium();
    connect();
  };

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
          onClick={handleConnectClick}
          className="btn-game"
        >
          Connect Wallet
        </button>
      )}

      {/* Seções de staking só aparecem quando conectado */}
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
