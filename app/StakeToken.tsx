'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSigner,
  useContractRead,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';
import abi from './contracts/tokenStaking.json';

const CONTRACT_ADDRESS = '0x29EeF959733826F5B4BaD0B367009D2bb452fFBb';
const SONEIUM_CHAIN_ID = 1868;
const DECIMALS = 18;

export default function StakeToken() {
  // — Hooks —
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  // — On-chain read —
  const { data: rawStaked } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'balances',
    args: [address!],
    watch: true,
    enabled: Boolean(address),
  });

  // — Local state —
  const [amount, setAmount] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
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
            if (!(window as any).ethereum) {
              return alert('MetaMask not found');
            }
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
                        decimals: DECIMALS,
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

  // — Formatting helper —
  const fmt = (wei?: ethers.BigNumber) =>
    wei ? ethers.utils.formatUnits(wei, DECIMALS) : '0.0';
  const staked = parseFloat(fmt(rawStaked)).toFixed(4);

  // — Unified generic error message —
  const showGenericError = () => {
    alert(
      'Transaction failed due to:\n' +
        '• Insufficient funds\n' +
        '• No rewards to claim\n' +
        '• Invalid withdraw amount\n' +
        '• Transaction canceled'
    );
  };

  // — Handlers —
  const handleStake = async () => {
    if (!contract || !amount) return;
    try {
      const tx = await contract.stake(
        ethers.utils.parseUnits(amount, DECIMALS)
      );
      await tx.wait();
      setAmount('');
      alert('Stake sent! Tx: ' + tx.hash);
    } catch {
      showGenericError();
    }
  };

  const handleClaim = async () => {
    if (!contract) return;
    try {
      const tx = await contract.claim();
      await tx.wait();
      alert('Rewards claimed! Tx: ' + tx.hash);
    } catch {
      showGenericError();
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmt) return;
    try {
      const tx = await contract.withdraw(
        ethers.utils.parseUnits(withdrawAmt, DECIMALS)
      );
      await tx.wait();
      setWithdrawAmt('');
      alert('Withdraw sent! Tx: ' + tx.hash);
    } catch {
      showGenericError();
    }
  };

  // — UI —
  return (
    <div className="max-w-lg mx-auto p-8 bg-white text-black rounded-2xl shadow-xl mt-12 space-y-8">
      <h1 className="text-3xl font-extrabold">💰 ENA Token Staking</h1>
      <p className="text-sm break-all text-gray-600">Connected: {address}</p>
      <button
        onClick={() => disconnect()}
        className="underline text-red-600"
      >
        Disconnect
      </button>

      <p className="text-lg">Staked Balance: <strong>{staked}</strong> ENA</p>

      {/* Stake Section */}
      <div className="space-y-3">
        <input
          type="number"
          step="any"
          placeholder="Amount to stake"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleStake}
          className="w-full bg-purple-600 text-white py-3 rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          Stake ENA
        </button>
      </div>

      {/* Claim Section */}
      <div>
        <button
          onClick={handleClaim}
          className="w-full bg-yellow-500 text-white py-3 rounded-lg shadow-md hover:bg-yellow-600 transition"
        >
          Claim Rewards
        </button>
      </div>

      {/* Withdraw Section */}
      <div className="space-y-3">
        <input
          type="number"
          step="any"
          placeholder="Amount to withdraw"
          value={withdrawAmt}
          onChange={(e) => setWithdrawAmt(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleWithdraw}
          className="w-full bg-red-600 text-white py-3 rounded-lg shadow-md hover:bg-red-700 transition"
        >
          Withdraw ENA
        </button>
      </div>
    </div>
  );
}
