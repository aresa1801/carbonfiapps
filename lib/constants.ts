export const BSC_TESTNET_CHAIN_ID = 97
export const HEDERA_TESTNET_CHAIN_ID = 296

export const CAFI_TOKEN_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetCafiTokenAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetCafiTokenAddress",
}

export const FAUCET_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetFaucetAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetFaucetAddress",
}

export const STAKING_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetStakingAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetStakingAddress",
}

export const FARMING_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetFarmingAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetFarmingAddress",
}

export const NFT_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetNFTAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetNFTAddress",
}

export const CARBON_RETIRE_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetCarbonRetireAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetCarbonRetireAddress",
}

export const MARKETPLACE_ADDRESS: { [chainId: number]: string } = {
  [BSC_TESTNET_CHAIN_ID]: "0xYourBscTestnetMarketplaceAddress",
  [HEDERA_TESTNET_CHAIN_ID]: "0xYourHederaTestnetMarketplaceAddress",
}

interface NetworkConfig {
  chainId: number
  chainHex: string
  name: string
  currency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorer: string
  contracts: {
    cafiToken: string
    faucet: string
    staking: string
    farming: string
    nft: string
    carbonRetire: string
    marketplace: string
  }
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 11155111, // Sepolia
    chainHex: "0xaa36a7",
    name: "Sepolia Testnet",
    currency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorer: "https://sepolia.etherscan.io",
    contracts: {
      cafiToken: "0xYourSepoliaCafiTokenAddress",
      faucet: "0xYourSepoliaFaucetAddress",
      staking: "0xYourSepoliaStakingAddress",
      farming: "0xYourSepoliaFarmingAddress",
      nft: "0xYourSepoliaNFTAddress",
      carbonRetire: "0xYourSepoliaCarbonRetireAddress",
      marketplace: "0xYourSepoliaMarketplaceAddress",
    },
  },
  {
    chainId: 97, // BSC Testnet
    chainHex: "0x61",
    name: "Binance Smart Chain Testnet",
    currency: {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    blockExplorer: "https://testnet.bscscan.com",
    contracts: {
      cafiToken: CAFI_TOKEN_ADDRESS[BSC_TESTNET_CHAIN_ID],
      faucet: FAUCET_ADDRESS[BSC_TESTNET_CHAIN_ID],
      staking: STAKING_ADDRESS[BSC_TESTNET_CHAIN_ID],
      farming: FARMING_ADDRESS[BSC_TESTNET_CHAIN_ID],
      nft: NFT_ADDRESS[BSC_TESTNET_CHAIN_ID],
      carbonRetire: CARBON_RETIRE_ADDRESS[BSC_TESTNET_CHAIN_ID],
      marketplace: MARKETPLACE_ADDRESS[BSC_TESTNET_CHAIN_ID],
    },
  },
  {
    chainId: 296, // Hedera Testnet
    chainHex: "0x128",
    name: "Hedera Testnet",
    currency: {
      name: "Hedera",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrls: ["https://testnet.hashio.io/api"],
    blockExplorer: "https://hashscan.io/testnet",
    contracts: {
      cafiToken: CAFI_TOKEN_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      faucet: FAUCET_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      staking: STAKING_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      farming: FARMING_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      nft: NFT_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      carbonRetire: CARBON_RETIRE_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
      marketplace: MARKETPLACE_ADDRESS[HEDERA_TESTNET_CHAIN_ID],
    },
  },
  {
    chainId: 4202, // Lisk Sepolia
    chainHex: "0x106a",
    name: "Lisk Sepolia Testnet",
    currency: {
      name: "Lisk",
      symbol: "LSK",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia-api.lisk.com"],
    blockExplorer: "https://sepolia-blockscout.lisk.com",
    contracts: {
      cafiToken: "0xYourLiskSepoliaCafiTokenAddress",
      faucet: "0xYourLiskSepoliaFaucetAddress",
      staking: "0xYourLiskSepoliaStakingAddress",
      farming: "0xYourLiskSepoliaFarmingAddress",
      nft: "0xYourLiskSepoliaNFTAddress",
      carbonRetire: "0xYourLiskSepoliaCarbonRetireAddress",
      marketplace: "0xYourLiskSepoliaMarketplaceAddress",
    },
  },
  {
    chainId: 84532, // Base Sepolia
    chainHex: "0x14a34",
    name: "Base Sepolia Testnet",
    currency: {
      name: "Base Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorer: "https://sepolia.basescan.org",
    contracts: {
      cafiToken: "0xYourBaseSepoliaCafiTokenAddress",
      faucet: "0xYourBaseSepoliaFaucetAddress",
      staking: "0xYourBaseSepoliaStakingAddress",
      farming: "0xYourBaseSepoliaFarmingAddress",
      nft: "0xYourBaseSepoliaNFTAddress",
      carbonRetire: "0xYourBaseSepoliaCarbonRetireAddress",
      marketplace: "0xYourBaseSepoliaMarketplaceAddress",
    },
  },
  {
    chainId: 44787, // Celo Alfajores
    chainHex: "0xa4ec",
    name: "Celo Alfajores Testnet",
    currency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
    blockExplorer: "https://alfajores.celoscan.io",
    contracts: {
      cafiToken: "0xYourCeloAlfajoresCafiTokenAddress",
      faucet: "0xYourCeloAlfajoresFaucetAddress",
      staking: "0xYourCeloAlfajoresStakingAddress",
      farming: "0xYourCeloAlfajoresFarmingAddress",
      nft: "0xYourCeloAlfajoresNFTAddress",
      carbonRetire: "0xYourCeloAlfajoresCarbonRetireAddress",
      marketplace: "0xYourCeloAlfajoresMarketplaceAddress",
    },
  },
]

export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return SUPPORTED_NETWORKS.find((network) => network.chainId === chainId)
}
