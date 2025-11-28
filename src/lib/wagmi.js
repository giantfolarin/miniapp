import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    farcasterMiniApp(), // Primary connector for Farcaster
    injected(), // Fallback: MetaMask, Rabby, etc.
    coinbaseWallet({ appName: 'Secret Messages' })
  ],
  transports: {
    [baseSepolia.id]: http('https://base-sepolia.drpc.org', {
      batch: true,
      retryCount: 3,
      timeout: 30000,
    }),
  },
})

export const CONTRACT_ADDRESS = '0x0df3135d5fe00dc5b4afd9e1ff2fa862d78b7350'

export const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_minBurnAmount", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BurnTooSmall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MessageEmpty",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amountBurned", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "message", "type": "string"}
    ],
    "name": "Confessed",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "string", "name": "message", "type": "string"}],
    "name": "confess",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confessionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "confessions",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "from", "type": "address"},
        {"internalType": "uint256", "name": "amountBurned", "type": "uint256"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "string", "name": "message", "type": "string"}
      ],
      "internalType": "struct OnchainConfessions.Confession",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBurnAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
    "name": "setMinBurnAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
