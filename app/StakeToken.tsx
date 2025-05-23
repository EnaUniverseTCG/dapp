// app/StakeToken.tsx
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
import erc20Abi from './contracts/erc20.json';
import stakingAbi from './contracts/tokenStaking.json';

const TOKEN_ADDRESS    = '0x4d465ee0827e073d81A3a024BFdcEaa84CAf410E';
const STAKING_ADDRESS  = '0x29EeF959733826F5B4BaD0B367009D2bb452fFBb';
const SONEIUM_CHAIN_ID = 1868;
const DECIMALS         = 18;

export default function StakeToken() {
  // — Hooks —
  const { address, isConnected } = useAccount();
  const { connect }              = useConnect({ connector: new InjectedConnector() });
  const { disconnect }           = useDisconnect();
  const { chain }                = useNetwork();
  const { data: signer }         = useSigner();

  // — Local state —  
  const [ready, setReady]           = useState(false);
  const [approved, setApproved]     = useState(false);
  const [stakeAmt, setStakeAmt]     = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [stakedBal, setStakedBal]   = useState('0.0000');
  const [pendingReward, setPendingReward] = useState('0.0000');

  // — Hydration guard —
  useEffect(() => {
    setReady(true);
  }, []);

  // — Refresh on signer/address —
  useEffect(() => {
    if (!signer || !address) return;
    const stakeC = new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer);
    stakeC.balances(address)
      .then((bn: ethers.BigNumber) =>
        setStakedBal(parseFloat(ethers.utils.formatUnits(bn, DECIMALS)).toFixed(4))
      ).catch(() => {});
    if (stakeC.pendingReward) {
      stakeC.pendingReward(address)
        .then((bn: ethers.BigNumber) =>
          setPendingReward(parseFloat(ethers.utils.formatUnits(bn, DECIMALS)).toFixed(4))
        ).catch(() => setPendingReward('0.0000'));
    }
  }, [signer, address]);

  // — Early returns —
  if (!ready) return null;
  if (!isConnected) {
    return (
      <div className="p-6">
        <button
          onClick={() => connect()}
          className="bg-green-600 text-white p-2 rounded"
        >
          Connect Wallet
        </button>
      </div>
    );
  }
  if (chain?.id !== SONEIUM_CHAIN_ID) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Wrong network: {chain?.name} ({chain?.id})
        </p>
        <button onClick={() => disconnect()} className="mt-2 underline">
          Disconnect
        </button>
      </div>
    );
  }

  // — Contracts —
  const tokenC = signer
    ? new ethers.Contract(TOKEN_ADDRESS, erc20Abi, signer)
    : null;
  const stakeC = signer
    ? new ethers.Contract(STAKING_ADDRESS, stakingAbi, signer)
    : null;

  // — Handlers —
  const handleApprove = async () => {
    if (!tokenC) return;
    try {
      const tx = await tokenC.approve(STAKING_ADDRESS, ethers.constants.MaxUint256);
      await tx.wait();
      setApproved(true);
      alert('✅ Approved ENA!');
    } catch (err: any) {
      alert('Approval failed: ' + (err.reason || err.message));
    }
  };

  const handleStake = async () => {
    if (!stakeC || !stakeAmt) {
      alert('• Insufficient funds\n• Invalid stake amount\n• Transaction canceled');
      return;
    }
    try {
      const amount = ethers.utils.parseUnits(stakeAmt, DECIMALS);
      const tx = await stakeC.stake(amount);
      await tx.wait();
      setStakeAmt('');
      const bn = await stakeC.balances(address!);
      setStakedBal(parseFloat(ethers.utils.formatUnits(bn, DECIMALS)).toFixed(4));
      alert(`✅ Staked ${stakeAmt} ENA`);
    } catch {
      alert('• Insufficient funds\n• Invalid stake amount\n• Transaction canceled');
    }
  };

  const handleClaim = async () => {
    if (!stakeC) return;
    try {
      const tx = await stakeC.claim();
      await tx.wait();
      const bn = await stakeC.pendingReward(address!);
      setPendingReward(parseFloat(ethers.utils.formatUnits(bn, DECIMALS)).toFixed(4));
      alert('✅ Rewards claimed!');
    } catch {
      alert('• No rewards to claim\n• Transaction canceled');
    }
  };

  const handleWithdraw = async () => {
    if (!stakeC || !withdrawAmt) {
      alert('• Invalid withdraw amount\n• Transaction canceled');
      return;
    }
    try {
      const amount = ethers.utils.parseUnits(withdrawAmt, DECIMALS);
      const tx = await stakeC.withdraw(amount);
      await tx.wait();
      setWithdrawAmt('');
      const bn = await stakeC.balances(address!);
      setStakedBal(parseFloat(ethers.utils.formatUnits(bn, DECIMALS)).toFixed(4));
      alert(`✅ Withdrew ${withdrawAmt} ENA`);
    } catch {
      alert('• Invalid withdraw amount\n• Transaction canceled');
    }
  };

  // — Render —
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-6">
      {/* Título */}
      <h1 className="text-3xl font-extrabold text-black">💰 ENA Token Staking</h1>

      {/* Conectado / disconnect */}
      <p className="text-gray-700 break-all">Connected: {address}</p>
      <button
        onClick={() => disconnect()}
        className="text-red-600 underline"
      >
        Disconnect
      </button>

      {/* Approved */}
      {!approved ? (
        <button
          onClick={handleApprove}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Approve ENA
        </button>
      ) : (
        <p className="text-green-600 font-bold">✅ Token Approved!</p>
      )}

      {/* Stake */}
      <div className="space-y-2">
        <p className="font-medium text-black">
          Staked Balance: <strong>{stakedBal}</strong> ENA
        </p>
        <input
          type="number"
          step="any"
          placeholder="Amount to stake"
          value={stakeAmt}
          onChange={e => setStakeAmt(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded text-black placeholder-gray-500 focus:outline-none"
        />
        <button
          onClick={handleStake}
          disabled={!approved}
          className={`w-full py-3 rounded-lg text-white ${
            approved ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
          } transition`}
        >
          Stake ENA
        </button>
      </div>

      {/* Claim */}
      <div className="space-y-2">
        <p className="font-medium text-black">
          Pending Rewards: <strong>{pendingReward}</strong> ENA
        </p>
        <button
          onClick={handleClaim}
          className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
        >
          Claim Rewards
        </button>
      </div>

      {/* Withdraw */}
      <div className="space-y-2">
        <input
          type="number"
          step="any"
          placeholder="Amount to withdraw"
          value={withdrawAmt}
          onChange={e => setWithdrawAmt(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded text-black placeholder-gray-500 focus:outline-none"
        />
        <button
          onClick={handleWithdraw}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
        >
          Withdraw ENA
        </button>
      </div>
    </div>
  );
}
