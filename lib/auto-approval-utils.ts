import { type BrowserProvider, Contract } from "ethers"
import { FAUCET_ADDRESS } from "@/lib/constants"
import FaucetABI from "@/contracts/faucet-abi.json"

export async function checkAutoApprovalStatus(provider: BrowserProvider, chainId: number): Promise<boolean> {
  try {
    const faucetContract = new Contract(FAUCET_ADDRESS[chainId], FaucetABI, provider)
    const isAutoApprovalEnabled = await faucetContract.isAutoApprovalEnabled()
    return isAutoApprovalEnabled
  } catch (error) {
    console.error("Error checking auto-approval status:", error)
    return false
  }
}

export async function toggleAutoApproval(
  signer: any, // Use JsonRpcSigner type if available, or any for flexibility
  chainId: number,
): Promise<boolean> {
  try {
    const faucetContract = new Contract(FAUCET_ADDRESS[chainId], FaucetABI, signer)
    const tx = await faucetContract.toggleAutoApproval()
    await tx.wait()
    return true
  } catch (error) {
    console.error("Error toggling auto-approval:", error)
    return false
  }
}
