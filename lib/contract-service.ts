import { ethers } from "ethers"
import nftAbi from "../contracts/nft-abi.json"
import stakingAbi from "../contracts/staking-abi.json"
import marketplaceAbi from "../contracts/marketplace-abi.json"
import carbonRetireAbi from "../contracts/carbon-retire-abi.json"
import faucetAbi from "../contracts/faucet-abi.json"

// Contract addresses
const NFT_CONTRACT_ADDRESS = "0x541F250F0699765dDC5DC064DaDBed31932118B8" // Updated NFT contract address
const STAKING_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
const MARKETPLACE_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const CARBON_RETIRE_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
const FAUCET_CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

class ContractService {
  provider: ethers.providers.Web3Provider | null = null
  signer: ethers.Signer | null = null

  // Initialize with provider and signer
  initialize(provider: ethers.providers.Web3Provider) {
    this.provider = provider
    this.signer = provider.getSigner()
  }

  // Get NFT contract instance
  getNFTContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not initialized")
    }
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, nftAbi, this.signer)
  }

  // Get staking contract instance
  getStakingContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not initialized")
    }
    return new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, this.signer)
  }

  // Get marketplace contract instance
  getMarketplaceContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not initialized")
    }
    return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, marketplaceAbi, this.signer)
  }

  // Get carbon retire contract instance
  getCarbonRetireContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not initialized")
    }
    return new ethers.Contract(CARBON_RETIRE_CONTRACT_ADDRESS, carbonRetireAbi, this.signer)
  }

  // Get faucet contract instance
  getFaucetContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not initialized")
    }
    return new ethers.Contract(FAUCET_CONTRACT_ADDRESS, faucetAbi, this.signer)
  }

  // Check if an address is a contract owner
  async isContractOwner(address: string) {
    try {
      if (!this.provider) {
        throw new Error("Provider not initialized")
      }

      const nftContract = this.getNFTContract()
      const owner = await nftContract.owner()

      return owner.toLowerCase() === address.toLowerCase()
    } catch (error) {
      console.error("Error checking contract owner:", error)
      return false
    }
  }

  // Check if auto-approval is enabled
  async isAutoApproveEnabled() {
    try {
      const nftContract = this.getNFTContract()
      return await nftContract.autoApproveEnabled()
    } catch (error) {
      console.error("Error checking auto-approval status:", error)
      return false
    }
  }

  // Toggle auto-approval status
  async toggleAutoApprove() {
    try {
      const nftContract = this.getNFTContract()
      const tx = await nftContract.toggleAutoApprove()
      await tx.wait()
      return true
    } catch (error) {
      console.error("Error toggling auto-approval:", error)
      throw error
    }
  }
}

// Create a singleton instance
const contractService = new ContractService()

export default contractService
