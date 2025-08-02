import { ethers } from "ethers"
import {
  CONTRACT_ADDRESSES, // Corrected import
  ZERO_ADDRESS,
} from "@/lib/constants"
import CAFITokenABI from "@/contracts/cafi-token-abi.json"
import FaucetABI from "@/contracts/faucet-abi.json"
import StakingABI from "@/contracts/staking-abi.json"
import NFTABI from "@/contracts/nft-abi.json"
import MarketplaceABI from "@/contracts/marketplace-abi.json"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"
import FarmingABI from "@/contracts/farming-abi.json"

// Type definitions for contract ABIs
import type { CafiToken } from "@/types/CafiToken"
import type { Faucet } from "@/types/Faucet"
import type { Staking } from "@/types/Staking"
import type { Nft } from "@/types/Nft"
import type { Marketplace } from "@/types/Marketplace"
import type { CarbonRetire } from "@/types/CarbonRetire"
import type { Farming } from "@/types/Farming"

// Define types for contract methods and events
export type StakeInfo = {
  amount: bigint
  stakeTime: bigint
  unlockTime: bigint
  claimed: boolean
  autoStaking: boolean
  compoundedAmount: bigint
}

export type CarbonProject = {
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

class ContractService {
  public provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null

  public async getProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
    if (!this.provider) {
      // Fallback to a default RPC provider if no wallet provider is set
      // This is useful for read-only operations when wallet is not connected
      const defaultRpcUrl =
        process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545"
      this.provider = new ethers.JsonRpcProvider(defaultRpcUrl)
      console.warn("No wallet provider set. Using default JsonRpcProvider for read-only operations.")
    }
    return this.provider
  }

  public async getSigner(): Promise<ethers.JsonRpcSigner> {
    const provider = await this.getProvider()
    if (!(provider instanceof ethers.BrowserProvider)) {
      throw new Error("No wallet connected. Cannot get a signer.")
    }
    return provider.getSigner()
  }

  public async contractExists(address: string): Promise<boolean> {
    if (!address || address === ZERO_ADDRESS) {
      return false
    }
    try {
      const provider = await this.getProvider()
      const code = await provider.getCode(address)
      return code !== "0x"
    } catch (error) {
      console.error(`Error checking contract existence for ${address}:`, error)
      return false
    }
  }

  // Helper to get a contract instance
  private async getContract<T extends ethers.Contract>(address: string, abi: any, withSigner = false): Promise<T> {
    if (!address || address === ZERO_ADDRESS) {
      throw new Error(`Invalid contract address: ${address}`)
    }
    const provider = await this.getProvider()
    if (withSigner) {
      const signer = await this.getSigner()
      return new ethers.Contract(address, abi, signer) as T
    }
    return new ethers.Contract(address, abi, provider) as T
  }

  // Specific contract getters
  public async getCAFITokenContract(
    address: string = CONTRACT_ADDRESSES.CAFI_TOKEN,
    withSigner = false,
  ): Promise<CafiToken> {
    return this.getContract<CafiToken>(address, CAFITokenABI, withSigner)
  }

  public async getFaucetContract(address: string = CONTRACT_ADDRESSES.FAUCET, withSigner = false): Promise<Faucet> {
    return this.getContract<Faucet>(address, FaucetABI, withSigner)
  }

  public async getStakingContract(address: string = CONTRACT_ADDRESSES.STAKING, withSigner = false): Promise<Staking> {
    return this.getContract<Staking>(address, StakingABI, withSigner)
  }

  public async getNftContract(address: string = CONTRACT_ADDRESSES.NFT, withSigner = false): Promise<Nft> {
    return this.getContract<Nft>(address, NFTABI, withSigner)
  }

  public async getMarketplaceContract(
    address: string = CONTRACT_ADDRESSES.MARKETPLACE,
    withSigner = false,
  ): Promise<Marketplace> {
    return this.getContract<Marketplace>(address, MarketplaceABI, withSigner)
  }

  public async getCarbonRetireContract(
    address: string = CONTRACT_ADDRESSES.CARBON_RETIRE,
    withSigner = false,
  ): Promise<CarbonRetire> {
    return this.getContract<CarbonRetire>(address, CarbonRetireABI, withSigner)
  }

  public async getFarmingContract(address: string = CONTRACT_ADDRESSES.FARMING, withSigner = false): Promise<Farming> {
    return this.getContract<Farming>(address, FarmingABI, withSigner)
  }

  // Utility functions
  public formatTokenAmount(amount: ethers.BigNumberish, decimals = 18): string {
    try {
      return ethers.formatUnits(amount, decimals)
    } catch (error) {
      console.error("Error formatting token amount:", amount, error)
      return "0.0"
    }
  }

  public parseTokenAmount(amount: string, decimals = 18): bigint {
    try {
      return ethers.parseUnits(amount, decimals)
    } catch (error) {
      console.error("Error parsing token amount:", amount, error)
      return BigInt(0)
    }
  }
}

export const contractService = new ContractService()
