import { Contract, type JsonRpcSigner, BrowserProvider } from "ethers"
import { toast } from "@/hooks/use-toast"
import NFTABI from "@/contracts/nft-abi.json"
import { NFT_ADDRESS } from "@/lib/constants"

export async function toggleAutoApproval(
  signer: JsonRpcSigner,
  chainId: number,
  currentStatus: boolean,
): Promise<boolean> {
  try {
    const nftContractAddress = NFT_ADDRESS[chainId]
    if (!nftContractAddress) {
      throw new Error(`NFT contract address not found for chain ID: ${chainId}`)
    }

    const nftContract = new Contract(nftContractAddress, NFTABI, signer)

    const tx = await nftContract.toggleAutoApprove()
    await tx.wait()

    toast({
      title: "Auto-Approval Toggled",
      description: `Auto-approval is now ${currentStatus ? "disabled" : "enabled"}.`,
    })
    return !currentStatus
  } catch (error: any) {
    console.error("Error toggling auto-approval:", error)
    toast({
      title: "Failed to Toggle Auto-Approval",
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    })
    return currentStatus
  }
}

export async function getAutoApprovalStatus(
  provider: any, // Use any for window.ethereum provider
  chainId: number,
): Promise<boolean> {
  try {
    const nftContractAddress = NFT_ADDRESS[chainId]
    if (!nftContractAddress) {
      console.warn(`NFT contract address not found for chain ID: ${chainId}. Defaulting auto-approval to false.`)
      return false
    }

    const ethersProvider = new BrowserProvider(provider)
    const nftContract = new Contract(nftContractAddress, NFTABI, ethersProvider)
    const status = await nftContract.autoApproveEnabled()
    return status
  } catch (error) {
    console.error("Error getting auto-approval status:", error)
    return false // Default to false on error
  }
}
