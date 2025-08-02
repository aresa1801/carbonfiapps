import { ethers } from "ethers"

// Define network configurations
export const NETWORK_CONFIG = {
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://eth-sepolia.public.blastapi.io",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  80001: {
    name: "Mumbai",
    currency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    explorer: "https://mumbai.polygonscan.com",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
  },
  97: {
    chainId: 97,
    name: "BSC Testnet",
    currency: { name: "Binance Coin", symbol: "BNB", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
  },
  296: {
    chainId: 296,
    name: "Hedera Testnet",
    currency: { name: "Hedera", symbol: "HBAR", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL || "https://testnet.hashio.io/api",
    blockExplorer: "https://hashscan.io/testnet",
  },
  295: {
    name: "Hedera Mainnet",
    currency: { name: "Hedera", symbol: "HBAR", decimals: 18 },
    explorer: "https://hashscan.io/mainnet",
    rpcUrl: "https://mainnet.hashio.io/api",
  },
  2221: {
    name: "Kava EVM Testnet",
    currency: { name: "Kava", symbol: "KAVA", decimals: 18 },
    explorer: "https://explorer.testnet.kava.io",
    rpcUrl: "https://evm.testnet.kava.io",
  },
  421613: {
    name: "Arbitrum Goerli",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://goerli.arbiscan.io",
    rpcUrl: "https://goerli-rollup.arbitrum.io/rpc",
  },
  420: {
    name: "Optimism Goerli",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://goerli-optimism.etherscan.io",
    rpcUrl: "https://goerli.optimism.io",
  },
  59140: {
    name: "Linea Goerli",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://goerli.lineascan.build",
    rpcUrl: "https://rpc.goerli.linea.build",
  },
  42220: {
    name: "Celo Mainnet",
    currency: { name: "Celo", symbol: "CELO", decimals: 18 },
    explorer: "https://celoscan.io",
    rpcUrl: "https://forno.celo.org",
  },
  44787: {
    chainId: 44787,
    name: "Celo Alfajores Testnet",
    currency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_CELO_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
  },
  100: {
    name: "Gnosis Chain",
    currency: { name: "xDAI", symbol: "xDAI", decimals: 18 },
    explorer: "https://gnosisscan.io",
    rpcUrl: "https://rpc.gnosischain.com",
  },
  84531: {
    name: "Base Goerli Testnet",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://goerli.basescan.org",
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://goerli.base.org",
  },
  42161: {
    name: "Arbitrum One",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://arbiscan.io",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  10: {
    name: "Optimism",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://optimistic.etherscan.io",
    rpcUrl: "https://mainnet.optimism.io",
  },
  59144: {
    name: "Linea Mainnet",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://lineascan.build",
    rpcUrl: "https://rpc.linea.build",
  },
  5000: {
    name: "Mantle Mainnet",
    currency: { name: "Mantle", symbol: "MNT", decimals: 18 },
    explorer: "https://explorer.mantle.xyz",
    rpcUrl: "https://rpc.mantle.xyz",
  },
  5001: {
    name: "Mantle Testnet",
    currency: { name: "Mantle", symbol: "MNT", decimals: 18 },
    explorer: "https://explorer.testnet.mantle.xyz",
    rpcUrl: "https://rpc.testnet.mantle.xyz",
  },
  167000: {
    name: "Taiko Katla L2",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.katla.taiko.xyz",
    rpcUrl: "https://rpc.katla.taiko.xyz",
  },
  167008: {
    name: "Taiko Jolnir L2",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.jolnir.taiko.xyz",
    rpcUrl: "https://rpc.jolnir.taiko.xyz",
  },
  167009: {
    name: "Taiko L3",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.taiko.xyz",
    rpcUrl: "https://rpc.taiko.xyz",
  },
  167007: {
    name: "Taiko A7",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a7.taiko.xyz",
    rpcUrl: "https://rpc.a7.taiko.xyz",
  },
  167004: {
    name: "Taiko A4",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a4.taiko.xyz",
    rpcUrl: "https://rpc.a4.taiko.xyz",
  },
  167005: {
    name: "Taiko A5",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a5.taiko.xyz",
    rpcUrl: "https://rpc.a5.taiko.xyz",
  },
  167006: {
    name: "Taiko A6",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a6.taiko.xyz",
    rpcUrl: "https://rpc.a6.taiko.xyz",
  },
  167003: {
    name: "Taiko A3",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a3.taiko.xyz",
    rpcUrl: "https://rpc.a3.taiko.xyz",
  },
  167002: {
    name: "Taiko A2",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a2.taiko.xyz",
    rpcUrl: "https://rpc.a2.taiko.xyz",
  },
  167001: {
    name: "Taiko A1",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    explorer: "https://explorer.a1.taiko.xyz",
    rpcUrl: "https://rpc.a1.taiko.xyz",
  },
  84532: {
    // Base Sepolia Testnet
    chainId: 84532,
    name: "Base Sepolia Testnet",
    currency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
} as const

// Define a default set of contract addresses for development/fallback
export const DEFAULT_CONTRACT_ADDRESSES = {
  ADMIN: "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6", // Example admin address
  CAFI_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  FAUCET: "0xe7f1725E7734CE288F8367e1853aE97d6AD7dAb3",
  STAKING: "0x9fE46736679d29a657B2f172fE802fc442f7893d",
  NFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fEf00B",
  MARKETPLACE: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  CARBON_RETIRE: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  FARMING: "0x0165878A59426CA204849FfF2C068E0Fcf9e2fF",
} as const

// Multi-network contract addresses mapping
export const MULTI_NETWORK_CONTRACTS = {
  [NETWORK_CONFIG[11155111].chainId]: DEFAULT_CONTRACT_ADDRESSES, // Sepolia
  [NETWORK_CONFIG[97].chainId]: DEFAULT_CONTRACT_ADDRESSES, // BSC Testnet
  [NETWORK_CONFIG[296].chainId]: DEFAULT_CONTRACT_ADDRESSES, // Hedera Testnet
  [NETWORK_CONFIG[84532].chainId]: DEFAULT_CONTRACT_ADDRESSES, // Base Sepolia
  [NETWORK_CONFIG[44787].chainId]: DEFAULT_CONTRACT_ADDRESSES, // Celo Alfajores Testnet
  // Add other chainId to contract address mappings here
} as const

// Function to get contract addresses based on current network
export const getContractAddresses = (chainId?: number) => {
  if (chainId && MULTI_NETWORK_CONTRACTS[chainId as keyof typeof MULTI_NETWORK_CONTRACTS]) {
    return MULTI_NETWORK_CONTRACTS[chainId as keyof typeof MULTI_NETWORK_CONTRACTS]
  }
  // Fallback to default if chainId is not provided or not found
  return DEFAULT_CONTRACT_ADDRESSES
}

// Export current contract addresses (for direct use if a specific network isn't needed)
export const CONTRACT_ADDRESSES = DEFAULT_CONTRACT_ADDRESSES

// Network detection helper
export const getSupportedNetworks = () => Object.values(NETWORK_CONFIG)

export const getNetworkByChainId = (chainId: number) => {
  return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG]
}

export const isSupportedNetwork = (chainId: number) => {
  return Object.keys(NETWORK_CONFIG).includes(chainId.toString())
}

// Add type definition for AddEthereumChainParameter if not already present
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      isRabby?: boolean
      isTrust?: boolean
      providers?: any[]
      request: (args: { method: string; params?: any[] | object }) => Promise<any>
      on: (eventName: string, handler: (...args: any[]) => void) => void
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void
    }
  }
}

export const addNetworkToMetamask = async (network: (typeof NETWORK_CONFIG)[keyof typeof NETWORK_CONFIG]) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!")
  }

  const params: any = {
    chainId: `0x${network.chainId.toString(16)}`,
    chainName: network.name,
    nativeCurrency: network.currency,
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [network.blockExplorer],
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [params],
    })
  } catch (error) {
    console.error("Failed to add network to MetaMask:", error)
    throw error
  }
}

export const ZERO_ADDRESS = ethers.ZeroAddress
