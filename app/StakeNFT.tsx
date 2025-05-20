'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSigner,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';
import abi from './contracts/nftStaking.json';

const CONTRACT_ADDRESS = '0x32FE8378aa41De37F96D7578a313711500836bfB';
const SONEIUM_CHAIN_ID = 1868;

export default function StakeNFT() {
  // — Hooks —
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  // — Estado local —
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [index, setIndex] = useState('');
  const [isClient, setIsClient] = useState(false);

  // — Hydration guard —
  useEffect(() => {
    setIsClient(true);
  }, []);

  // — Reload on chain change —
  useEffect(() => {
    if ((window as any).ethereum) {
      const handler = (hex: string) => {
        if (parseInt(hex, 16) !== SONEIUM_CHAIN_ID) {
          window.location.reload();
        }
      };
      (window as any).ethereum.on('chainChanged', handler);
      return () => {
        (window as any).ethereum.removeListener('chainChanged', handler);
      };
    }
  }, []);

  if (!isClient) return null;

  // 1) Connect Wallet
  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6">
        <button
          onClick={() => connect()}
          className="w-full bg-green-600 text-white py-3 rounded-lg shadow-lg hover:bg-green-700 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // 2) Ensure Soneium Mainnet
  if (chain?.id !== SONEIUM_CHAIN_ID) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <p className="text-red-600">
          Current network: {chain?.name} ({chain?.id})<br />
          Please switch to Soneium Mainnet.
        </p>
        <button
          onClick={async () => {
            if (!(window as any).ethereum) return alert('MetaMask not found');
            try {
              await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x74C' }],
              });
            } catch (err: any) {
              if (err.code === 4902) {
                await (window as any).ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x74C',
                      chainName: 'Soneium Mainnet',
                      nativeCurrency: {
                        name: 'Ether',
                        symbol: 'ETH',
                        decimals: 18,
                      },
                      rpcUrls: ['https://rpc.soneium.org'],
                      blockExplorerUrls: ['https://explorer.soneium.org'],
                    },
                  ],
                });
              } else {
                alert('Error switching network: ' + err.message);
              }
            }
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
        >
          Switch to Soneium Mainnet
        </button>
      </div>
    );
  }

  // — Contract instance —
  const contract = signer
    ? new ethers.Contract(CONTRACT_ADDRESS, abi, signer)
    : null;

  const showError = () => {
    alert(
      'Transaction failed due to:\n' +
        '• Invalid NFT ID or amount\n' +
        '• No rewards to claim\n' +
        '• Invalid index\n' +
        '• Transaction canceled'
    );
  };

  // — Handlers —
  const handleStake = async () => {
    if (!contract || !tokenId || !amount) return;
    try {
      const tx = await contract.stake(
        ethers.BigNumber.from(tokenId),
        ethers.BigNumber.from(amount)
      );
      await tx.wait();
      setTokenId('');
      setAmount('');
      alert('Stake sent! Tx: ' + tx.hash);
    } catch {
      showError();
    }
  };

  const handleClaimAll = async () => {
    if (!contract) return;
    try {
      const tx = await contract.claimAll();
      await tx.wait();
      alert('Claim sent! Tx: ' + tx.hash);
    } catch {
      showError();
    }
  };

  const handleUnstake = async () => {
    if (!contract || !index) return;
    try {
      const tx = await contract.unstake(ethers.BigNumber.from(index));
      await tx.wait();
      setIndex('');
      alert('Unstake sent! Tx: ' + tx.hash);
    } catch {
      showError();
    }
  };

  // — Render UI —
  return (
    <div className="max-w-lg mx-auto p-8 bg-white text-black rounded-2xl shadow-xl mt-12 space-y-8">
      {/* Cabeçalho */}
      <h1 className="text-3xl font-extrabold">🚀 ENA NFT Staking</h1>
      <p className="text-sm break-all text-gray-600">Connected: {address}</p>
      <button
        onClick={() => disconnect()}
        className="underline text-red-600"
      >
        Disconnect
      </button>

      {/* Stake NFT */}
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleStake}
          className="w-full bg-purple-600 text-white py-3 rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          Stake NFT
        </button>
      </div>

      {/* Claim All */}
      <div>
        <button
          onClick={handleClaimAll}
          className="w-full bg-yellow-500 text-white py-3 rounded-lg shadow-md hover:bg-yellow-600 transition"
        >
          Claim All Rewards
        </button>
      </div>

      {/* Unstake NFT */}
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Index"
          value={index}
          onChange={(e) => setIndex(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleUnstake}
          className="w-full bg-red-600 text-white py-3 rounded-lg shadow-md hover:bg-red-700 transition"
        >
          Unstake NFT
        </button>
      </div>
    </div>
  );
}
