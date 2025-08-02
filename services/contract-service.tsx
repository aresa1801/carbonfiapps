import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import cafiTokenAbi from "@/contracts/cafi-token-abi.json"
import stakingAbi from "@/contracts/staking-abi.json"
import nftAbi from "@/contracts/nft-abi.json"
import faucetAbi from "@/contracts/faucet-abi.json"
import marketplaceAbi from "@/contracts/marketplace-abi.json"
import carbonRetireAbi from "@/contracts/carbon-retire-abi.json"

// Import the NFT_ABI, STAKING_ABI, etc. from lib/contract-utils
import {
  NFT_ABI,
  STAKING_ABI,
  ERC20_ABI,
  FAUCET_ABI,
  MARKETPLACE_ABI,
  CARBON_RETIRE_ABI,
  FARMING_ABI,
} from "@/lib/contract-utils"

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
  ERC20_ABI = ERC20_ABI
  STAKING_ABI = STAKING_ABI
  NFT_ABI = NFT_ABI
  FAUCET_ABI = FAUCET_ABI
  MARKETPLACE_ABI = MARKETPLACE_ABI
  CARBON_RETIRE_ABI = CARBON_RETIRE_ABI
  FARMING_ABI = FARMING_ABI
  CONTRACT_ADDRESSES = CONTRACT_ADDRESSES

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
  async getTokenContract(address = CONTRACT_ADDRESSES.CAFI_TOKEN, requireSigner = false): Promise<ethers.Contract> {
    try {
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

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(address, cafiTokenAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(address, cafiTokenAbi, provider)
      }
    } catch (error) {
      console.error("Error getting token contract:", error)
      throw error
    }
  }

  // Get staking contract with error handling
  async getStakingContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (!CONTRACT_ADDRESSES.STAKING || CONTRACT_ADDRESSES.STAKING === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid staking contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.STAKING)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.STAKING}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.STAKING, stakingAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.STAKING, stakingAbi, provider)
      }
    } catch (error) {
      console.error("Error getting staking contract:", error)
      throw error
    }
  }

  // Get NFT contract with error handling
  async getNftContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (!CONTRACT_ADDRESSES.NFT || CONTRACT_ADDRESSES.NFT === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid NFT contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.NFT)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.NFT}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.NFT, nftAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.NFT, nftAbi, provider)
      }
    } catch (error) {
      console.error("Error getting NFT contract:", error)
      throw error
    }
  }

  // Get faucet contract with error handling
  async getFaucetContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (!CONTRACT_ADDRESSES.FAUCET || CONTRACT_ADDRESSES.FAUCET === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid faucet contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.FAUCET)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.FAUCET}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.FAUCET, faucetAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.FAUCET, faucetAbi, provider)
      }
    } catch (error) {
      console.error("Error getting faucet contract:", error)
      throw error
    }
  }

  // Get marketplace contract with error handling
  async getMarketplaceContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (
        !CONTRACT_ADDRESSES.MARKETPLACE ||
        CONTRACT_ADDRESSES.MARKETPLACE === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error("Invalid marketplace contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.MARKETPLACE)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.MARKETPLACE}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, marketplaceAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, marketplaceAbi, provider)
      }
    } catch (error) {
      console.error("Error getting marketplace contract:", error)
      throw error
    }
  }

  // Get carbon retire contract with error handling
  async getCarbonRetireContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (
        !CONTRACT_ADDRESSES.CARBON_RETIRE ||
        CONTRACT_ADDRESSES.CARBON_RETIRE === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error("Invalid carbon retire contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.CARBON_RETIRE)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.CARBON_RETIRE}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.CARBON_RETIRE, carbonRetireAbi, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.CARBON_RETIRE, carbonRetireAbi, provider)
      }
    } catch (error) {
      console.error("Error getting carbon retire contract:", error)
      throw error
    }
  }

  // Get farming contract with error handling
  async getFarmingContract(requireSigner = false): Promise<ethers.Contract> {
    try {
      if (!CONTRACT_ADDRESSES.FARMING || CONTRACT_ADDRESSES.FARMING === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid farming contract address")
      }

      const exists = await this.contractExists(CONTRACT_ADDRESSES.FARMING)
      if (!exists) {
        throw new Error(`No contract found at address: ${CONTRACT_ADDRESSES.FARMING}`)
      }

      if (requireSigner) {
        const signer = await this.getSigner(true)
        return new ethers.Contract(CONTRACT_ADDRESSES.FARMING, FARMING_ABI, signer)
      } else {
        const provider = await this.getProvider()
        return new ethers.Contract(CONTRACT_ADDRESSES.FARMING, FARMING_ABI, provider)
      }
    } catch (error) {
      console.error("Error getting farming contract:", error)
      throw error
    }
  }

  // Check if auto-approve is enabled
  async isAutoApproveEnabled(): Promise<boolean> {
    try {
      const nftContract = await this.getNftContract()
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
