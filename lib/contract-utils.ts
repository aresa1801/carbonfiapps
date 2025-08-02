import { ethers } from "ethers"
import {
  CAFI_TOKEN_ADDRESS,
  FAUCET_ADDRESS,
  STAKING_ADDRESS,
  FARMING_ADDRESS,
  NFT_ADDRESS,
  CARBON_RETIRE_ADDRESS,
  MARKETPLACE_ADDRESS,
} from "./constants"
import CAFITokenABI from "../contracts/cafi-token-abi.json"
import FaucetABI from "../contracts/faucet-abi.json"
import StakingABI from "../contracts/staking-abi.json"
import FarmingABI from "../contracts/farming-abi.json"
import NFTABI from "../contracts/nft-abi.json"
import CarbonRetireABI from "../contracts/carbon-retire-abi.json"
import MarketplaceABI from "../contracts/marketplace-abi.json"

// Define minimal ERC20 ABI for fallback
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
]

// Define interfaces for contract data structures
export interface StakeInfo {
  amount: bigint
  stakeTime: bigint
  unlockTime: bigint
  claimed: boolean
  autoStaking: boolean
  compoundedAmount: bigint
}

export interface CarbonProject {
  projectName: string
  projectType: string
  location: string
  carbonReduction: bigint
  methodology: string
  documentHash: string
  imageCID: string
  startDate: bigint
  endDate: bigint
  creator: string
}

export interface FarmPackage {
  stakeTokenAddress: string
  lockDuration: bigint
  apyBps: bigint
  minimumStakeAmount: bigint
  isActive: boolean
}

export interface UserStake {
  packageId: bigint
  stakedAmount: bigint
  stakeStartTimestamp: bigint
  lastRewardClaimTimestamp: bigint
  isAutoCompounding: boolean
}

export interface Verifier {
  name: string
  wallet: string
  isActive: boolean
}

export interface NFTListing {
  seller: string
  tokenId: bigint
  amount: bigint
  pricePerItem: bigint
  listingFeePaid: bigint
}

export interface RetirementCertificate {
  retirer: string
  tokenId: bigint
  amount: bigint
  timestamp: bigint
  certificateId: string
  certificateURI: string
}

class ContractService {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null
  signer: ethers.Signer | null = null

  // Get provider
  async getProvider() {
    if (!this.provider) {
      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        // Use a fallback provider for read-only operations
        this.provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io")
      }
    }
    return this.provider
  }

  // Get signer
  async getSigner() {
    if (!this.signer) {
      const provider = await this.getProvider()
      if (provider instanceof ethers.BrowserProvider) {
        this.signer = await provider.getSigner()
      } else {
        throw new Error("Cannot get signer from JsonRpcProvider")
      }
    }
    return this.signer
  }

  // Check if contract exists at address
  async contractExists(address: string): Promise<boolean> {
    try {
      if (!address) return false

      // Normalize the address to ensure proper checksum
      try {
        address = ethers.getAddress(address)
      } catch (checksumError) {
        console.error(`Invalid address format: ${address}`, checksumError)
        return false
      }

      const provider = await this.getProvider()
      const code = await provider.getCode(address)
      return code !== "0x"
    } catch (error) {
      console.error(`Error checking if contract exists at ${address}:`, error)
      return false
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash: string) {
    try {
      const provider = await this.getProvider()
      return await provider.waitForTransaction(txHash)
    } catch (error) {
      console.error("Error waiting for transaction:", error)
      throw error
    }
  }

  // Get token contract (using CAFI token ABI)
  async getTokenContract(address?: string, withSigner = false) {
    try {
      const contractAddress = address || CAFI_TOKEN_ADDRESS[await this.getChainId()]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, CAFITokenABI, signer)
      }
      return new ethers.Contract(contractAddress, CAFITokenABI, provider)
    } catch (error) {
      console.error("Error getting token contract:", error)
      throw error
    }
  }

  // Get CAFI token contract
  async getCAFITokenContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = CAFI_TOKEN_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, CAFITokenABI, signer)
      }
      return new ethers.Contract(contractAddress, CAFITokenABI, provider)
    } catch (error) {
      console.error("Error getting CAFI token contract:", error)
      throw error
    }
  }

  // Get faucet contract
  async getFaucetContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = FAUCET_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, FaucetABI, signer)
      }
      return new ethers.Contract(contractAddress, FaucetABI, provider)
    } catch (error) {
      console.error("Error getting faucet contract:", error)
      throw error
    }
  }

  // Get staking contract
  async getStakingContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = STAKING_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, StakingABI, signer)
      }
      return new ethers.Contract(contractAddress, StakingABI, provider)
    } catch (error) {
      console.error("Error getting staking contract:", error)
      throw error
    }
  }

  // Get NFT contract
  async getNftContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = NFT_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, NFTABI, signer)
      }
      return new ethers.Contract(contractAddress, NFTABI, provider)
    } catch (error) {
      console.error("Error getting NFT contract:", error)
      throw error
    }
  }

  // Get marketplace contract
  async getMarketplaceContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = MARKETPLACE_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, MarketplaceABI, signer)
      }
      return new ethers.Contract(contractAddress, MarketplaceABI, provider)
    } catch (error) {
      console.error("Error getting marketplace contract:", error)
      throw error
    }
  }

  // Get carbon retire contract
  async getCarbonRetireContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = CARBON_RETIRE_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, CarbonRetireABI, signer)
      }
      return new ethers.Contract(contractAddress, CarbonRetireABI, provider)
    } catch (error) {
      console.error("Error getting carbon retire contract:", error)
      throw error
    }
  }

  // Get farming contract
  async getFarmingContract(chainId: number, withSigner = false) {
    try {
      const contractAddress = FARMING_ADDRESS[chainId]
      const provider = await this.getProvider()
      if (withSigner) {
        const signer = await this.getSigner()
        return new ethers.Contract(contractAddress, FarmingABI, signer)
      }
      return new ethers.Contract(contractAddress, FarmingABI, provider)
    } catch (error) {
      console.error("Error getting farming contract:", error)
      throw error
    }
  }

  // Format token amount
  formatTokenAmount(amount: ethers.BigNumberish, decimals = 18): string {
    return ethers.formatUnits(amount, decimals)
  }

  // Parse token amount
  parseTokenAmount(amount: string, decimals = 18): ethers.BigNumberish {
    return ethers.parseUnits(amount, decimals)
  }

  // Format address for display
  formatAddress(address: string): string {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(38)}`
  }

  // Helper methods for specific contract interactions

  // Staking contract helpers
  async getStakingPackages() {
    try {
      const stakingContract = await this.getStakingContract(await this.getChainId())
      const packages = []

      // Get lock periods and APY rates for standard packages (0, 1, 2)
      for (let i = 0; i < 3; i++) {
        try {
          const [lockPeriod, apyRate] = await Promise.all([
            stakingContract.getLockPeriod(i).catch(() => stakingContract.lockPeriods(i)),
            stakingContract.apyRates(i),
          ])

          packages.push({
            id: i,
            name: i === 0 ? "30 Days" : i === 1 ? "90 Days" : "180 Days",
            lockPeriod: Number(lockPeriod),
            apy: Number(apyRate) / 100, // Convert from basis points
            apyDisplay: `${(Number(apyRate) / 100).toFixed(1)}%`,
          })
        } catch (error) {
          console.error(`Error loading staking package ${i}:`, error)
        }
      }

      return packages
    } catch (error) {
      console.error("Error getting staking packages:", error)
      return []
    }
  }

  // NFT contract helpers
  async getVerifiers() {
    try {
      const nftContract = await this.getNftContract(await this.getChainId())
      const verifiers = []

      // Try to load verifiers from index 0 to 9
      for (let i = 0; i < 10; i++) {
        try {
          const verifier = await nftContract.verifiers(i)
          if (verifier && verifier.wallet !== ethers.ZeroAddress) {
            verifiers.push({
              index: i,
              name: verifier.name,
              wallet: verifier.wallet,
              isActive: verifier.isActive,
            })
          }
        } catch (error) {
          // Stop when we can't get more verifiers
          break
        }
      }

      return verifiers
    } catch (error) {
      console.error("Error getting verifiers:", error)
      return []
    }
  }

  // Farming contract helpers
  async getFarmingPackages() {
    try {
      const farmingContract = await this.getFarmingContract(await this.getChainId())
      const packageCount = await farmingContract.getActivePackageCount()
      const packages = []

      for (let i = 0; i < Number(packageCount); i++) {
        try {
          const packageDetails = await farmingContract.getPackageDetails(i)
          packages.push({
            id: i,
            stakeTokenAddress: packageDetails.stakeTokenAddress,
            lockDuration: packageDetails.lockDuration,
            apyBps: packageDetails.apyBps,
            minimumStakeAmount: packageDetails.minimumStakeAmount,
            isActive: packageDetails.isActive,
            // Computed fields
            lockDurationDays: Number(packageDetails.lockDuration) / 86400,
            apyPercent: Number(packageDetails.apyBps) / 100,
            minStakeFormatted: this.formatTokenAmount(packageDetails.minimumStakeAmount),
          })
        } catch (error) {
          console.error(`Error loading farming package ${i}:`, error)
        }
      }

      return packages
    } catch (error) {
      console.error("Error getting farming packages:", error)
      return []
    }
  }

  // Marketplace helpers
  async getMarketplaceListing(tokenId: number, seller: string) {
    try {
      const marketplaceContract = await this.getMarketplaceContract(await this.getChainId())
      const listing = await marketplaceContract.listings(tokenId, seller)

      if (listing.seller === ethers.ZeroAddress) {
        return null
      }

      return {
        seller: listing.seller,
        tokenId: listing.tokenId,
        amount: listing.amount,
        pricePerItem: listing.pricePerItem,
        listingFeePaid: listing.listingFeePaid,
        // Computed fields
        totalPrice: listing.amount * listing.pricePerItem,
        pricePerItemFormatted: this.formatTokenAmount(listing.pricePerItem),
        totalPriceFormatted: this.formatTokenAmount(listing.amount * listing.pricePerItem),
        listingFeeFormatted: this.formatTokenAmount(listing.listingFeePaid),
      }
    } catch (error) {
      console.error("Error getting marketplace listing:", error)
      return null
    }
  }

  // Get marketplace constants
  async getMarketplaceConstants() {
    try {
      const marketplaceContract = await this.getMarketplaceContract(await this.getChainId())

      const [feePercent, feeDenominator, minAmount, minPrice] = await Promise.all([
        marketplaceContract.FEE_PERCENT(),
        marketplaceContract.FEE_DENOMINATOR(),
        marketplaceContract.MIN_AMOUNT(),
        marketplaceContract.MIN_PRICE(),
      ])

      return {
        feePercent: Number(feePercent),
        feeDenominator: Number(feeDenominator),
        actualFeePercent: (Number(feePercent) / Number(feeDenominator)) * 100,
        minAmount: Number(minAmount),
        minPrice: minPrice,
        minPriceFormatted: this.formatTokenAmount(minPrice),
      }
    } catch (error) {
      console.error("Error getting marketplace constants:", error)
      return {
        feePercent: 0,
        feeDenominator: 10000,
        actualFeePercent: 0,
        minAmount: 1,
        minPrice: BigInt(0),
        minPriceFormatted: "0",
      }
    }
  }

  // Calculate listing fee
  async calculateListingFee(amount: bigint, pricePerItem: bigint) {
    try {
      const constants = await this.getMarketplaceConstants()
      const totalValue = amount * pricePerItem
      const fee = (totalValue * BigInt(constants.feePercent)) / BigInt(constants.feeDenominator)
      return fee
    } catch (error) {
      console.error("Error calculating listing fee:", error)
      return BigInt(0)
    }
  }

  // Get chain ID
  async getChainId() {
    const provider = await this.getProvider()
    return await provider.getNetwork().then((network) => network.chainId)
  }
}

// Create a singleton instance
export const contractService = new ContractService()

// Export ABIs directly as named exports
export { ERC20_ABI, NFTABI, StakingABI, FaucetABI, MarketplaceABI, CarbonRetireABI, FarmingABI }

// Export utility functions
export const formatTokenAmount = contractService.formatTokenAmount.bind(contractService)
export const parseTokenAmount = contractService.parseTokenAmount.bind(contractService)

// Export contract getter functions
export const getTokenContract = contractService.getTokenContract.bind(contractService)
export const getCafiTokenContract = contractService.getCAFITokenContract.bind(contractService)
export const getFaucetContract = contractService.getFaucetContract.bind(contractService)
export const getStakingContract = contractService.getStakingContract.bind(contractService)
export const getNftContract = contractService.getNftContract.bind(contractService)
export const getMarketplaceContract = contractService.getMarketplaceContract.bind(contractService)
export const getCarbonRetireContract = contractService.getCarbonRetireContract.bind(contractService)
export const getFarmingContract = contractService.getFarmingContract.bind(contractService)

// Re-export CONTRACT_ADDRESSES for convenience
export {
  CAFI_TOKEN_ADDRESS,
  FAUCET_ADDRESS,
  STAKING_ADDRESS,
  FARMING_ADDRESS,
  NFT_ADDRESS,
  CARBON_RETIRE_ADDRESS,
  MARKETPLACE_ADDRESS,
}
