import { ethers } from "ethers"

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
