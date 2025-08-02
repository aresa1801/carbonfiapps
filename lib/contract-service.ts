import { ethers, Contract, type BrowserProvider, type JsonRpcSigner } from "ethers"
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

class ContractService {
  private provider: BrowserProvider | null = null
  private signer: JsonRpcSigner | null = null

  setProvider(provider: BrowserProvider) {
    this.provider = provider
  }

  setSigner(signer: JsonRpcSigner) {
    this.signer = signer
  }

  async getContract(address: string, abi: any, useSigner = false): Promise<Contract> {
    if (!this.provider) {
      throw new Error("Provider not set. Call setProvider first.")
    }
    const currentSigner = useSigner && this.signer ? this.signer : this.provider
    return new Contract(address, abi, currentSigner)
  }

  async getCAFITokenContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = CAFI_TOKEN_ADDRESS[chainId]
    if (!address) throw new Error(`CAFI Token contract not found for chain ID: ${chainId}`)
    return this.getContract(address, CAFITokenABI, useSigner)
  }

  async getFaucetContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = FAUCET_ADDRESS[chainId]
    if (!address) throw new Error(`Faucet contract not found for chain ID: ${chainId}`)
    return this.getContract(address, FaucetABI, useSigner)
  }

  async getStakingContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = STAKING_ADDRESS[chainId]
    if (!address) throw new Error(`Staking contract not found for chain ID: ${chainId}`)
    return this.getContract(address, StakingABI, useSigner)
  }

  async getFarmingContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = FARMING_ADDRESS[chainId]
    if (!address) throw new Error(`Farming contract not found for chain ID: ${chainId}`)
    return this.getContract(address, FarmingABI, useSigner)
  }

  async getNftContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = NFT_ADDRESS[chainId]
    if (!address) throw new Error(`NFT contract not found for chain ID: ${chainId}`)
    return this.getContract(address, NFTABI, useSigner)
  }

  async getCarbonRetireContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = CARBON_RETIRE_ADDRESS[chainId]
    if (!address) throw new Error(`Carbon Retire contract not found for chain ID: ${chainId}`)
    return this.getContract(address, CarbonRetireABI, useSigner)
  }

  async getMarketplaceContract(useSigner = false): Promise<Contract> {
    if (!this.provider) throw new Error("Provider not set.")
    const chainId = Number((await this.provider.getNetwork()).chainId)
    const address = MARKETPLACE_ADDRESS[chainId]
    if (!address) throw new Error(`Marketplace contract not found for chain ID: ${chainId}`)
    return this.getContract(address, MarketplaceABI, useSigner)
  }

  formatTokenAmount(amount: bigint, decimals = 18): string {
    return ethers.formatUnits(amount, decimals)
  }

  parseTokenAmount(amount: string, decimals = 18): bigint {
    return ethers.parseUnits(amount, decimals)
  }
}

export const contractService = new ContractService()
