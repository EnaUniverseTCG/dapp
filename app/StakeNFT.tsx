// app/StakeNFT.tsx
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
// ABI do staking (stake/claimAll/unstake)
import stakingAbi from './contracts/nftStaking.json';
// ABI mínimo do ERC-1155 só para approval
const erc1155Abi = [
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved)',
];

const NFT_ADDRESS = '0xAc5e3A872BDA267a48281191Cc3f7a466Afd2C4E';
const STAKING_ADDRESS = '0x32FE8378aa41De37F96D7578a313711500836bfB';
const SONEIUM_CHAIN_ID = 1868;

export default function StakeNFT() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  const [isClient, setIsClient] = useState(false);
  const [approved, setApproved] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [index, setIndex] = useState('');

  // hydration guard
  useEffect(() => {
    setIsClient(true);
  }, []);

  // check already approved
  useEffect(() => {
    if (!signer || !address) return;
    const erc1155 = new ethers.Contract(NFT_ADDRESS, erc1155Abi, signer);
    erc1155
      .isApprovedForAll(address, STAKING_ADDRESS)
      .then((ok: boolean) => setApproved(ok))
      .catch(() => setApproved(false));
  }, [signer, address]);

  // reload on chain change
  useEffect(() => {
    if (!(window as any).ethereum) return;
    const handler = (hex: string) => {
      if (parseInt(hex, 16) !== SONEIUM_CHAIN_ID) {
        window.location.reload();
      }
    };
    (window as any).ethereum.on('chainChanged', handler);
    return () => {
      (window as any).ethereum.removeListener('chainChanged', handler);
    };
  }, []);

  if (!isClient) return null;

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
  if (chain?.id !== SONEIUM_CHAIN_ID) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <p className="text-red-600">
          Current network: {chain?.name} ({chain?.id})<br />
          Please switch to Soneium Mainnet.
        </p>
        <button
          onClick={() => disconnect()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // === AQUI: instanciar staking com STAKING_ADDRESS, não NFT_ADDRESS ===
  const erc1155 = signer
    ? new ethers.Contract(NFT_ADDRESS, erc1155Abi, signer)
    : null;
  const staking = signer
    ? new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer)
    : null;

  const showError = () =>
    alert(
      'Transaction failed due to:\n' +
        '• Invalid NFT ID or amount\n' +
        '• No rewards to claim\n' +
        '• Invalid index\n' +
        '• Transaction canceled'
    );

  // handlers
  const handleApproveAll = async () => {
    if (!erc1155) return;
    try {
      const tx = await erc1155.setApprovalForAll(STAKING_ADDRESS, true);
      await tx.wait();
      setApproved(true);
    } catch {
      showError();
    }
  };

  const handleStake = async () => {
    if (!staking || !tokenId || !amount) return;
    try {
      const tx = await staking.stake(
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
    if (!staking) return;
    try {
      const tx = await staking.claimAll();
      await tx.wait();
      alert('Claim sent! Tx: ' + tx.hash);
    } catch {
      showError();
    }
  };

  const handleUnstake = async () => {
    if (!staking || !index) return;
    try {
      const tx = await staking.unstake(ethers.BigNumber.from(index));
      await tx.wait();
      setIndex('');
      alert('Unstake sent! Tx: ' + tx.hash);
    } catch {
      showError();
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white text-black rounded-2xl shadow-xl mt-12 space-y-8">
      <h1 className="text-3xl font-extrabold">🚀 ENA NFT Staking</h1>
      <p className="text-sm break-all text-gray-600">Connected: {address}</p>
      <button
        onClick={() => disconnect()}
        className="underline text-red-600"
      >
        Disconnect
      </button>

      {!approved ? (
        <button
          onClick={handleApproveAll}
          className="w-full bg-purple-600 text-white py-3 rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          Approve NFT Staking
        </button>
      ) : (
        <>
          <p className="text-green-600 font-bold">
            ✅ NFT Approved for All!
          </p>

          {/* Stake */}
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

          {/* Claim */}
          <button
            onClick={handleClaimAll}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg shadow-md hover:bg-yellow-600 transition"
          >
            Claim All Rewards
          </button>

          {/* Unstake */}
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
        </>
      )}
    </div>
  );
}
