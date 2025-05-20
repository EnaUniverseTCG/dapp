import { Chain } from 'wagmi';

export const soneium: Chain = {
  id: 1868,
  name: 'Soneium',
  network: 'soneium',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.soneium.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Soneium Explorer',
      url: 'https://explorer.soneium.org',
    },
  },
};
