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
import stakingAbi from '../contracts/tokenStaking.json';

// Minimal ERC20 ABI so we don’t need a separate token.json:
const erc20Abi = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const CONTRACT_ADDRESS = '0x29EeF959733826F5B4BaD0B367009D2bb452fFBb';
const DECIMALS = 18;
const SONEIUM_CHAIN_ID = 1868;

export default function StakeTokenClient() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  // read staked
  const { data: rawStaked } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'balances',
    args: [address!],
    watch: true,
    enabled: Boolean(address),
  });

  // client guard
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return null;

  // 1) connect
  if (!isConnected) {
    return (
      <button
        onClick={() => connect()}
        className="w-full bg-green-600 text-white py-3 rounded-lg"
      >
        Connect Wallet
      </button>
    );
  }

  // 2) network
  if (chain?.id !== SONEIUM_CHAIN_ID) {
    return (
      <>
        <p className="text-red-600">
          Wrong network: {chain?.name} ({chain?.id})
        </p>
        <button
          onClick={async () => {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x74C' }],
            });
          }}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Switch to Soneium
        </button>
      </>
    );
  }

  // contract instances
  const tokenContract = signer
    ? new ethers.Contract(CONTRACT_ADDRESS, erc20Abi, signer)
    : null;
  const stakingContract = signer
    ? new ethers.Contract(CONTRACT_ADDRESS, stakingAbi, signer)
    : null;

  // format staked
  const fmt = (wei?: ethers.BigNumber) =>
    wei ? ethers.utils.formatUnits(wei, DECIMALS) : '0.0';
  const staked = parseFloat(fmt(rawStaked as ethers.BigNumber)).toFixed(4);

  // approval state
  const [approved, setApproved] = useState(false);
  useEffect(() => {
    async function check() {
      if (!tokenContract || !address) return;
      const allowance = await tokenContract.allowance(
        address,
        CONTRACT_ADDRESS
      );
      setApproved(allowance.gt(0));
    }
    check();
  }, [tokenContract, address]);

  // handlers
  const handleApprove = async () => {
    if (!tokenContract) return;
    const tx = await tokenContract.approve(
      CONTRACT_ADDRESS,
      ethers.constants.MaxUint256
    );
    await tx.wait();
    setApproved(true);
  };
  const [amt, setAmt] = useState('');
  const handleStake = async () => {
    if (!stakingContract || !amt) return;
    const tx = await stakingContract.stake(
      ethers.utils.parseUnits(amt, DECIMALS)
    );
    await tx.wait();
    setAmt('');
    alert('Staked!');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">ENA Token Staking</h2>
      <p className="mb-2">Connected: {address}</p>
      <p className="mb-4">Staked: {staked} ENA</p>

      {!approved ? (
        <>
          <button
            onClick={handleApprove}
            className="w-full bg-purple-600 text-white py-3 rounded-lg mb-2"
          >
            Approve ENA
          </button>
          <p className="text-sm text-gray-500">
            First time? Click “Approve” once to allow staking.
          </p>
        </>
      ) : (
        <>
          <input
            type="number"
            placeholder="Amount to stake"
            className="w-full border p-2 rounded mb-2"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
          />
          <button
            onClick={handleStake}
            className="w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Stake ENA
          </button>
        </>
      )}
    </div>
  );
}
