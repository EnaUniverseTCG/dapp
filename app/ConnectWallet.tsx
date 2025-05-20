'use client'

import { useAccount, useConnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

interface ConnectWalletProps {
  className?: string
}

export default function ConnectWallet({ className }: ConnectWalletProps) {
  const { isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })

  // nothing to show once you’re connected
  if (isConnected) return null

  return (
    <button
      onClick={() => connect()}
      className={className ?? 'bg-green-600 text-white py-2 px-4 rounded'}
    >
      Connect Wallet
    </button>
  )
}
