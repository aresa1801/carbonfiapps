/**
 * Network Configuration for Multi-Chain EVM Support
 * Defines supported networks with their RPC URLs, native currencies, and explorers
 */

export interface NetworkConfig {
  chainId: number
  name: string
  displayName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrl: string
  blockExplorer: string
  isTestnet: boolean
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: "sepolia",
    displayName: "Ethereum Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },

  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    name: "base-sepolia",
    displayName: "Base Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia-explorer.base.org",
    isTestnet: true,
  },

  // Hedera Testnet - Special handling for HBAR
  296: {
    chainId: 296,
    name: "hedera-testnet",
    displayName: "Hedera Testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrl: "https://testnet.hashio.io/api",
    blockExplorer: "https://hashscan.io/testnet",
    isTestnet: true,
  },

  // Binance Smart Chain Testnet
  97: {
    chainId: 97,
    name: "bsc-testnet",
    displayName: "BSC Testnet",
    nativeCurrency: {
      name: "Test BNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    isTestnet: true,
  },

  // Lisk Sepolia Testnet
  4202: {
    chainId: 4202,
    name: "lisk-sepolia",
    displayName: "Lisk Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    blockExplorer: "https://sepolia-blockscout.lisk.com",
    isTestnet: true,
  },
}

/**
 * Helper function to check if a network is Hedera
 * Used for special HBAR handling in gas calculations
 */
export const isHederaNetwork = (chainId: number): boolean => {
  return chainId === 296
}

/**
 * Get network configuration by chain ID
 */
export const getNetworkConfig = (chainId: number): NetworkConfig | undefined => {
  return SUPPORTED_NETWORKS[chainId]
}

/**
 * Get all supported chain IDs
 */
export const getSupportedChainIds = (): number[] => {
  return Object.keys(SUPPORTED_NETWORKS).map(Number)
}

/**
 * Format chain ID for MetaMask network switching
 */
export const formatChainId = (chainId: number): string => {
  return `0x${chainId.toString(16)}`
}
