import type { AddEthereumChainParameter } from "ethers"

interface ContractAddresses {
  CAFI_TOKEN: string
  FAUCET: string
  STAKING: string
  FARMING: string
  NFT: string
  CARBON_RETIRE: string
  MARKETPLACE: string
}

interface NetworkConfig {
  chainId: number
  name: string
  currency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrl: string
  blockExplorerUrl: string
  contracts: ContractAddresses
}

export const SEPOLIA_CHAIN_ID = 11155111
export const BSC_TESTNET_CHAIN_ID = 97
export const HEDERA_TESTNET_CHAIN_ID = 296
export const LISK_SEPOLIA_CHAIN_ID = 4202
export const BASE_SEPOLIA_CHAIN_ID = 84532
export const CELO_ALFAJORES_CHAIN_ID = 44787

const networks: NetworkConfig[] = [
  {
    chainId: SEPOLIA_CHAIN_ID,
    name: "Sepolia Testnet",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    contracts: {
      CAFI_TOKEN: "0xYourSepoliaCAFITokenAddress",
      FAUCET: "0xYourSepoliaFaucetAddress",
      STAKING: "0xYourSepoliaStakingAddress",
      FARMING: "0xYourSepoliaFarmingAddress",
      NFT: "0xYourSepoliaNFTAddress",
      CARBON_RETIRE: "0xYourSepoliaCarbonRetireAddress",
      MARKETPLACE: "0xYourSepoliaMarketplaceAddress",
    },
  },
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    name: "BSC Testnet",
    currency: { name: "Binance Coin", symbol: "BNB", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorerUrl: "https://testnet.bscscan.com",
    contracts: {
      CAFI_TOKEN: "0xYourBSCCAFITokenAddress",
      FAUCET: "0xYourBSCFaucetAddress",
      STAKING: "0xYourBSCStakingAddress",
      FARMING: "0xYourBSCFarmingAddress",
      NFT: "0xYourBSCNFTAddress",
      CARBON_RETIRE: "0xYourBSCCarbonRetireAddress",
      MARKETPLACE: "0xYourBSCMarketplaceAddress",
    },
  },
  {
    chainId: HEDERA_TESTNET_CHAIN_ID,
    name: "Hedera Testnet",
    currency: { name: "Hedera", symbol: "HBAR", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL || "https://testnet.hedera.com",
    blockExplorerUrl: "https://hashscan.io/testnet",
    contracts: {
      CAFI_TOKEN: "0xYourHederaCAFITokenAddress",
      FAUCET: "0xYourHederaFaucetAddress",
      STAKING: "0xYourHederaStakingAddress",
      FARMING: "0xYourHederaFarmingAddress",
      NFT: "0xYourHederaNFTAddress",
      CARBON_RETIRE: "0xYourHederaCarbonRetireAddress",
      MARKETPLACE: "0xYourHederaMarketplaceAddress",
    },
  },
  {
    chainId: LISK_SEPOLIA_CHAIN_ID,
    name: "Lisk Sepolia Testnet",
    currency: { name: "Lisk Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com",
    blockExplorerUrl: "https://sepolia-blockscout.lisk.com",
    contracts: {
      CAFI_TOKEN: "0xYourLiskCAFITokenAddress",
      FAUCET: "0xYourLiskFaucetAddress",
      STAKING: "0xYourLiskStakingAddress",
      FARMING: "0xYourLiskFarmingAddress",
      NFT: "0xYourLiskNFTAddress",
      CARBON_RETIRE: "0xYourLiskCarbonRetireAddress",
      MARKETPLACE: "0xYourLiskMarketplaceAddress",
    },
  },
  {
    chainId: BASE_SEPOLIA_CHAIN_ID,
    name: "Base Sepolia Testnet",
    currency: { name: "Base Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    blockExplorerUrl: "https://sepolia.basescan.org",
    contracts: {
      CAFI_TOKEN: "0xYourBaseCAFITokenAddress",
      FAUCET: "0xYourBaseFaucetAddress",
      STAKING: "0xYourBaseStakingAddress",
      FARMING: "0xYourBaseFarmingAddress",
      NFT: "0xYourBaseNFTAddress",
      CARBON_RETIRE: "0xYourBaseCarbonRetireAddress",
      MARKETPLACE: "0xYourBaseMarketplaceAddress",
    },
  },
  {
    chainId: CELO_ALFAJORES_CHAIN_ID,
    name: "Celo Alfajores Testnet",
    currency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpcUrl: process.env.NEXT_PUBLIC_CELO_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org",
    blockExplorerUrl: "https://alfajores.celoscan.io",
    contracts: {
      CAFI_TOKEN: "0xYourCeloCAFITokenAddress",
      FAUCET: "0xYourCeloFaucetAddress",
      STAKING: "0xYourCeloStakingAddress",
      FARMING: "0xYourCeloFarmingAddress",
      NFT: "0xYourCeloNFTAddress",
      CARBON_RETIRE: "0xYourCeloCarbonRetireAddress",
      MARKETPLACE: "0xYourCeloMarketplaceAddress",
    },
  },
]

export const getContractAddresses = (chainId: number): ContractAddresses => {
  const network = networks.find((net) => net.chainId === chainId)
  if (!network) {
    console.warn(`No contract addresses found for chainId: ${chainId}`)
    return {
      CAFI_TOKEN: "0x",
      FAUCET: "0x",
      STAKING: "0x",
      FARMING: "0x",
      NFT: "0x",
      CARBON_RETIRE: "0x",
      MARKETPLACE: "0x",
    }
  }
  return network.contracts
}

export const getSupportedNetworks = (): NetworkConfig[] => {
  return networks
}

export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return networks.find((network) => network.chainId === chainId)
}

export const addNetworkToMetamask = async (network: NetworkConfig) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!")
  }

  const params: AddEthereumChainParameter = {
    chainId: `0x${network.chainId.toString(16)}`,
    chainName: network.name,
    nativeCurrency: network.currency,
    rpcUrls: [network.rpcUrl],
    blockExplorer
