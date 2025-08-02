import { Contract, type JsonRpcSigner, type Provider } from "ethers"
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

export const getContract = (address: string, abi: any, signerOrProvider: JsonRpcSigner | Provider) => {
  return new Contract(address, abi, signerOrProvider)
}

export const getCafiTokenContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(CAFI_TOKEN_ADDRESS[chainId], CAFITokenABI, signerOrProvider)
}

export const getFaucetContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(FAUCET_ADDRESS[chainId], FaucetABI, signerOrProvider)
}

export const getStakingContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(STAKING_ADDRESS[chainId], StakingABI, signerOrProvider)
}

export const getFarmingContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(FARMING_ADDRESS[chainId], FarmingABI, signerOrProvider)
}

export const getNftContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(NFT_ADDRESS[chainId], NFTABI, signerOrProvider)
}

export const getCarbonRetireContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(CARBON_RETIRE_ADDRESS[chainId], CarbonRetireABI, signerOrProvider)
}

export const getMarketplaceContract = (chainId: number, signerOrProvider: JsonRpcSigner | Provider) => {
  return getContract(MARKETPLACE_ADDRESS[chainId], MarketplaceABI, signerOrProvider)
}
