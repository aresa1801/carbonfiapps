// Network configurations
export const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.public.blastapi.io",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  LISK_SEPOLIA: {
    chainId: 4202,
    name: "Lisk Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    blockExplorer: "https://sepolia-blockscout.lisk.com",
  },
  BSC_TESTNET: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
  },
  HEDERA_TESTNET: {
    chainId: 296,
    name: "Hedera Testnet",
    rpcUrl: "https://testnet.hashio.io/api", // Updated RPC URL
    blockExplorer: "https://hashscan.io/testnet", // Updated Block Explorer URL
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia Testnet",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
  CELO_ALFAJORES: {
    chainId: 44787,
    name: "Celo Alfajores Testnet",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
  },
}

// Original contract addresses (Sepolia Ethereum Testnet)
export const ORIGINAL_CONTRACT_ADDRESSES = {
  ADMIN: "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6",
  CAFI_TOKEN: "0xa5359E55423E47Afe93D86b1bdaD827f1C1c16EB",
  STAKING: "0x2aCB71B2861c7C64eD6D172cE23023e2990d9DAf",
  NFT: "0xB47D4AB7041a537029AB6f939434AdFEe885356a",
  FAUCET: "0xaa9E0Fb59474BDc8Cfe43120678B72b4012672ec",
  MARKETPLACE: "0xf8eF029c17cf49A18b0cC4200D4c5F20a2E7A6f3",
  CARBON_RETIRE: "0xb1F73a3fE5524D0975871Ec6E31F0d909B0773B7",
  FARMING: "0x754a429de2cdBb4391619cc96D1466efb0921DDc",
}

// New contract addresses (Multi-network compatible)
export const NEW_CONTRACT_ADDRESSES = {
  ADMIN: "0x732eBd7B8c50A8e31EAb04aF774F4160C8c22Dd6",
  CAFI_TOKEN: "0x94D04211337709F08Db73811b744c816E74C5916",
  STAKING: "0xa6238b5cD8E13cf259790Cef6872e8a6b4E3119d",
  NFT: "0x7945C669cE8b75259254fbA9ac0F225a21b4FB66",
  FAUCET: "0xeabEdd6241A4E00f44b18Ec9e371d97311CF1242", // Updated FAUCET address
  MARKETPLACE: "0xBb071E9731E862bCc4953E3407424bE076886D8f",
  CARBON_RETIRE: "0x2E08821d0613A23529c12DE33253E6572a72319D",
  FARMING: "0x38e48065aA6Fb27EeA5aBdceF4bA297e071813d4",
}

// Multi-network contract addresses mapping
export const MULTI_NETWORK_CONTRACTS = {
  [NETWORKS.SEPOLIA.chainId]: ORIGINAL_CONTRACT_ADDRESSES,
  [NETWORKS.LISK_SEPOLIA.chainId]: NEW_CONTRACT_ADDRESSES,
  [NETWORKS.BSC_TESTNET.chainId]: NEW_CONTRACT_ADDRESSES,
  [NETWORKS.HEDERA_TESTNET.chainId]: NEW_CONTRACT_ADDRESSES,
  [NETWORKS.BASE_SEPOLIA.chainId]: NEW_CONTRACT_ADDRESSES,
  [NETWORKS.CELO_ALFAJORES.chainId]: NEW_CONTRACT_ADDRESSES,
}

// Function to get contract addresses based on current network
export const getContractAddresses = (chainId?: number) => {
  if (!chainId) {
    // Default to new contracts if no chain ID provided
    return NEW_CONTRACT_ADDRESSES
  }

  return MULTI_NETWORK_CONTRACTS[chainId] || NEW_CONTRACT_ADDRESSES
}

// Export current contract addresses (backwards compatibility)
export const CONTRACT_ADDRESSES = NEW_CONTRACT_ADDRESSES

// Network detection helper
export const getSupportedNetworks = () => Object.values(NETWORKS)

export const getNetworkByChainId = (chainId: number) => {
  return Object.values(NETWORKS).find((network) => network.chainId === chainId)
}

export const isSupportedNetwork = (chainId: number) => {
  return Object.keys(MULTI_NETWORK_CONTRACTS).includes(chainId.toString())
}
