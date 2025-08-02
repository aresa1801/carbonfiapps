import { Contract, parseEther, formatEther } from "ethers"
import { getContractAddresses } from "./constants"
import CAFITokenABI from "@/contracts/cafi-token-abi.json"
import FaucetABI from "@/contracts/faucet-abi.json"
import StakingABI from "@/contracts/staking-abi.json"
import FarmingABI from "@/contracts/farming-abi.json"
import NFTABI from "@/contracts/nft-abi.json"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"
import MarketplaceABI from "@/contracts/marketplace-abi.json"

// Helper to get contract instances
export const getContracts = (signerOrProvider: any, chainId: number) => {
  const addresses = getContractAddresses(chainId)

  return {
    cafiTokenContract: new Contract(addresses.CAFI_TOKEN, CAFITokenABI, signerOrProvider),
    faucetContract: new Contract(addresses.FAUCET, FaucetABI, signerOrProvider),
    stakingContract: new Contract(addresses.STAKING, StakingABI, signerOrProvider),
    farmingContract: new Contract(addresses.FARMING, FarmingABI, signerOrProvider),
    nftContract: new Contract(addresses.NFT, NFTABI, signerOrProvider),
    carbonRetireContract: new Contract(addresses.CARBON_RETIRE, CarbonRetireABI, signerOrProvider),
    marketplaceContract: new Contract(addresses.MARKETPLACE, MarketplaceABI, signerOrProvider),
  }
}

// CAFI Token Operations
export const mintCafiTokens = async (cafiTokenContract: Contract, toAddress: string, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await cafiTokenContract.mint(toAddress, parsedAmount)
  return tx.wait()
}

export const burnCafiTokens = async (cafiTokenContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await cafiTokenContract.burn(parsedAmount)
  return tx.wait()
}

export const transferCafiTokens = async (cafiTokenContract: Contract, toAddress: string, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await cafiTokenContract.transfer(toAddress, parsedAmount)
  return tx.wait()
}

export const getCafiBalance = async (cafiTokenContract: Contract, address: string) => {
  const balance = await cafiTokenContract.balanceOf(address)
  return formatEther(balance)
}

export const getCafiTotalSupply = async (cafiTokenContract: Contract) => {
  const totalSupply = await cafiTokenContract.totalSupply()
  return formatEther(totalSupply)
}

// Faucet Operations
export const claimFaucetTokens = async (faucetContract: Contract) => {
  const tx = await faucetContract.claim()
  return tx.wait()
}

export const getClaimStatus = async (faucetContract: Contract, userAddress: string) => {
  const [canClaim, timeUntilNextClaim] = await faucetContract.getClaimStatus(userAddress)
  return { canClaim, timeUntilNextClaim: Number(timeUntilNextClaim) }
}

export const setFaucetClaimAmount = async (faucetContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await faucetContract.setClaimAmount(parsedAmount)
  return tx.wait()
}

export const setFaucetClaimInterval = async (faucetContract: Contract, interval: number) => {
  const tx = await faucetContract.setClaimInterval(interval)
  return tx.wait()
}

export const mintToFaucet = async (faucetContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await faucetContract.mintToFaucet(parsedAmount)
  return tx.wait()
}

// Staking Operations
export const stakeTokens = async (stakingContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await stakingContract.stake(parsedAmount)
  return tx.wait()
}

export const unstakeTokens = async (stakingContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await stakingContract.unstake(parsedAmount)
  return tx.wait()
}

export const getStakedBalance = async (stakingContract: Contract, userAddress: string) => {
  const balance = await stakingContract.stakedBalance(userAddress)
  return formatEther(balance)
}

export const getStakingRewardRate = async (stakingContract: Contract) => {
  const rate = await stakingContract.rewardRate()
  return formatEther(rate)
}

export const getStakingRewards = async (stakingContract: Contract, userAddress: string) => {
  const rewards = await stakingContract.getReward(userAddress)
  return formatEther(rewards)
}

export const claimStakingRewards = async (stakingContract: Contract) => {
  const tx = await stakingContract.claimReward()
  return tx.wait()
}

export const setStakingRewardRate = async (stakingContract: Contract, rate: string) => {
  const parsedRate = parseEther(rate)
  const tx = await stakingContract.setRewardRate(parsedRate)
  return tx.wait()
}

// Farming Operations
export const depositFarmingTokens = async (farmingContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await farmingContract.deposit(parsedAmount)
  return tx.wait()
}

export const withdrawFarmingTokens = async (farmingContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await farmingContract.withdraw(parsedAmount)
  return tx.wait()
}

export const getFarmingStakedBalance = async (farmingContract: Contract, userAddress: string) => {
  const balance = await farmingContract.stakedBalance(userAddress)
  return formatEther(balance)
}

export const getFarmingRewardRate = async (farmingContract: Contract) => {
  const rate = await farmingContract.rewardRate()
  return formatEther(rate)
}

export const getFarmingRewards = async (farmingContract: Contract, userAddress: string) => {
  const rewards = await farmingContract.getReward(userAddress)
  return formatEther(rewards)
}

export const claimFarmingRewards = async (farmingContract: Contract) => {
  const tx = await farmingContract.claimReward()
  return tx.wait()
}

export const setFarmingRewardRate = async (farmingContract: Contract, rate: string) => {
  const parsedRate = parseEther(rate)
  const tx = await farmingContract.setRewardRate(parsedRate)
  return tx.wait()
}

// NFT Operations
export const mintNFT = async (nftContract: Contract, toAddress: string, tokenId: number) => {
  const tx = await nftContract.mint(toAddress, tokenId)
  return tx.wait()
}

export const getNFTBalance = async (nftContract: Contract, ownerAddress: string) => {
  const balance = await nftContract.balanceOf(ownerAddress)
  return Number(balance)
}

export const getNFTTokenURI = async (nftContract: Contract, tokenId: number) => {
  const uri = await nftContract.tokenURI(tokenId)
  return uri
}

export const setNFTBaseURI = async (nftContract: Contract, newBaseURI: string) => {
  const tx = await nftContract.setBaseURI(newBaseURI)
  return tx.wait()
}

// Carbon Retire Operations
export const retireCarbon = async (carbonRetireContract: Contract, amount: string) => {
  const parsedAmount = parseEther(amount)
  const tx = await carbonRetireContract.retire(parsedAmount)
  return tx.wait()
}

export const getRetiredAmount = async (carbonRetireContract: Contract, userAddress: string) => {
  const amount = await carbonRetireContract.retiredAmounts(userAddress)
  return formatEther(amount)
}

export const setVerifierStatus = async (
  carbonRetireContract: Contract,
  verifierAddress: string,
  isVerifier: boolean,
) => {
  const tx = await carbonRetireContract.setVerifier(verifierAddress, isVerifier)
  return tx.wait()
}

export const isVerifier = async (carbonRetireContract: Contract, verifierAddress: string) => {
  const status = await carbonRetireContract.isVerifier(verifierAddress)
  return status
}

export const setAutoApproval = async (carbonRetireContract: Contract, verifierAddress: string, status: boolean) => {
  const tx = await carbonRetireContract.setAutoApproval(verifierAddress, status)
  return tx.wait()
}

export const isAutoApproved = async (carbonRetireContract: Contract, verifierAddress: string) => {
  const status = await carbonRetireContract.isAutoApproved(verifierAddress)
  return status
}

// Marketplace Operations
export const listItem = async (marketplaceContract: Contract, nftAddress: string, tokenId: number, price: string) => {
  const parsedPrice = parseEther(price)
  const tx = await marketplaceContract.listItem(nftAddress, tokenId, parsedPrice)
  return tx.wait()
}

export const buyItem = async (marketplaceContract: Contract, itemId: number, value: string) => {
  const parsedValue = parseEther(value)
  const tx = await marketplaceContract.buyItem(itemId, { value: parsedValue })
  return tx.wait()
}

export const cancelListing = async (marketplaceContract: Contract, itemId: number) => {
  const tx = await marketplaceContract.cancelListing(itemId)
  return tx.wait()
}

export const getListing = async (marketplaceContract: Contract, itemId: number) => {
  const listing = await marketplaceContract.listings(itemId)
  return {
    itemId: Number(listing.itemId),
    nftAddress: listing.nftAddress,
    tokenId: Number(listing.tokenId),
    seller: listing.seller,
    price: formatEther(listing.price),
    isSold: listing.isSold,
  }
}

export const getListingCount = async (marketplaceContract: Contract) => {
  const count = await marketplaceContract.itemIds()
  return Number(count)
}
