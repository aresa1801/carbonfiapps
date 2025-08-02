import { ethers, type Contract } from "ethers"
import CAFITokenABI from "@/contracts/cafi-token-abi.json"
import FaucetABI from "@/contracts/faucet-abi.json"
import StakingABI from "@/contracts/staking-abi.json"
import FarmingABI from "@/contracts/farming-abi.json"
import NFTABI from "@/contracts/nft-abi.json"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"
import MarketplaceABI from "@/contracts/marketplace-abi.json"
import {
  CAFI_TOKEN_ADDRESS,
  FAUCET_ADDRESS,
  STAKING_ADDRESS,
  FARMING_ADDRESS,
  NFT_ADDRESS,
  CARBON_RETIRE_ADDRESS,
  MARKETPLACE_ADDRESS,
} from "@/lib/constants"

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
  imageHash: string
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
}

export interface RetirementCertificate {
  retirer: string
  tokenId: bigint
  amount: bigint
  timestamp: bigint
  certificateId: string
  certificateURI: string
}

export interface FarmPackage {
  stakeToken: string
  duration: bigint
  apy: bigint
  minStake: bigint
  isActive: boolean
}

export interface UserStake {
  packageId: bigint
  amount: bigint
  startTime: bigint
  lastClaimTime: bigint
  isAutoFarming: boolean
}

class ContractService {
  provider: ethers.BrowserProvider | null = null

  // Get provider with error handling
  async getProvider(): Promise<ethers.BrowserProvider> {
    if (!this.provider) {
      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        throw new Error("No Ethereum provider available")
      }
    }
    return this.provider
  }

  // Check if a contract exists at the given address
  async contractExists(address: string): Promise<boolean> {
    try {
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        console.log(`Invalid contract address: ${address}`)
        return false
      }

      // Normalize the address to ensure proper checksum
      try {
        const normalizedAddress = ethers.getAddress(address)
        if (normalizedAddress !== address) {
          console.log(`Address checksum corrected: ${address} → ${normalizedAddress}`)
          address = normalizedAddress
        }
      } catch (checksumError) {
        console.error(`Invalid address format: ${address}`, checksumError)
        return false
      }

      const provider = await this.getProvider()
      const code = await provider.getCode(address)
      return code !== "0x"
    } catch (error) {
      console.error(`Error checking contract at ${address}:`, error)
      return false
    }
  }

  // Get signer with error handling
  async getSigner(requireSigner = false): Promise<ethers.JsonRpcSigner> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      return signer
    } catch (error) {
      console.error("Error getting signer:", error)
      if (requireSigner) {
        throw new Error("Failed to get signer. Please connect your wallet.")
      }
      throw error
    }
  }

  // Format token amount from wei to ether
  formatTokenAmount(amount: bigint | string): string {
    try {
      return ethers.formatUnits(amount, 18)
    } catch (error) {
      console.error("Error formatting token amount:", error)
      return "0"
    }
  }

  // Parse token amount from ether to wei
  parseTokenAmount(amount: string): bigint {
    try {
      return ethers.parseUnits(amount, 18)
    } catch (error) {
      console.error("Error parsing token amount:", error)
      return BigInt(0)
    }
  }

  // Get token contract with error handling
  async getTokenContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      let address = CAFI_TOKEN_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid token contract address")
      }

      // Normalize the address to ensure proper checksum
      try {
        address = ethers.getAddress(address)
      } catch (checksumError) {
        console.error(`Invalid address format: ${address}`, checksumError)
        throw new Error(`Invalid address format: ${address}`)
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, CAFITokenABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting token contract:", error)
      throw error
    }
  }

  // Get staking contract with error handling
  async getStakingContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = STAKING_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid staking contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, StakingABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting staking contract:", error)
      throw error
    }
  }

  // Get NFT contract with error handling
  async getNftContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = NFT_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid NFT contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, NFTABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting NFT contract:", error)
      throw error
    }
  }

  // Get faucet contract with error handling
  async getFaucetContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = FAUCET_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid faucet contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, FaucetABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting faucet contract:", error)
      throw error
    }
  }

  // Get marketplace contract with error handling
  async getMarketplaceContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = MARKETPLACE_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid marketplace contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, MarketplaceABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting marketplace contract:", error)
      throw error
    }
  }

  // Get carbon retire contract with error handling
  async getCarbonRetireContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = CARBON_RETIRE_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid carbon retire contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, CarbonRetireABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting carbon retire contract:", error)
      throw error
    }
  }

  // Get farming contract with error handling
  async getFarmingContract(chainId: number, requireSigner = false): Promise<Contract> {
    try {
      const address = FARMING_ADDRESS[chainId]
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid farming contract address")
      }

      const exists = await this.contractExists(address)
      if (!exists) {
        throw new Error(`No contract found at address: ${address}`)
      }

      const signerOrProvider = requireSigner ? await this.getSigner(true) : await this.getProvider()
      return new ethers.Contract(address, FarmingABI, signerOrProvider)
    } catch (error) {
      console.error("Error getting farming contract:", error)
      throw error
    }
  }

  // Check if auto-approve is enabled
  async isAutoApproveEnabled(chainId: number): Promise<boolean> {
    try {
      const nftContract = await this.getNftContract(chainId)
      return await nftContract.autoApproveEnabled()
    } catch (error) {
      console.error("Error checking auto-approve status:", error)
      return false
    }
  }
}

// Create and export a singleton instance
const contractService = new ContractService()
export { contractService }

// This file seems to be a duplicate or an older version of lib/contract-service.ts
// It's recommended to use a single source of truth for contract interactions.
// For now, I will keep it as is, but note that `lib/contract-service.ts` is the one being used by Web3Provider.
// If this file is intended to be used, its imports and exports need to be aligned with the rest of the project.
// For the purpose of fixing the current error, no changes are needed here.
