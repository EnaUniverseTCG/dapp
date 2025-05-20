// src/main.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  WagmiConfig,
  createConfig,
  configureChains,
  useAccount,
  useConnect,
  useDisconnect,
  useContractWrite,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { soneium } from './utils/chains';
import abi from './contracts/nftStaking.json';

const { chains, publicClient } = configureChains([soneium], [publicProvider()]);

const config = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

function StakeNFT() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();

  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');

  const { write: stakeNFT } = useContractWrite({
    address: '0x32FE8378aa41De37F96D7578a313711500836bfB',
    abi: abi,
    functionName: 'stake',
    args: [BigInt(tokenId), BigInt(amount)],
  });

  return (
    <div style={{ padding: 24 }}>
      <h2>📦 NFT Staking - ENA</h2>
      {!isConnected ? (
        <button onClick={() => connect()}>Connect Wallet</button>
      ) : (
        <>
          <p>Wallet: {address}</p>
          <button onClick={() => disconnect()}>Disconnect</button>

          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Token ID"
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={() => stakeNFT?.()}>Stake</button>
          </div>
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <WagmiConfig config={config}>
    <StakeNFT />
  </WagmiConfig>
);
