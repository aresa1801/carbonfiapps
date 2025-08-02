import { Contract } from "ethers"
import { getContractAddresses } from "./constants"
import CarbonRetireABI from "@/contracts/carbon-retire-abi.json"

export const getAutoApprovalStatus = async (
  verifierAddress: string,
  chainId: number,
  provider: any, // Use a more specific type if available, e.g., JsonRpcProvider
): Promise<boolean> => {
  try {
    const contractAddresses = getContractAddresses(chainId)
    const carbonRetireContract = new Contract(contractAddresses.CARBON_RETIRE, CarbonRetireABI, provider)
    const isApproved = await carbonRetireContract.isAutoApproved(verifierAddress)
    return isApproved
  } catch (error) {
    console.error("Error fetching auto-approval status:", error)
    return false
  }
}

export const setAutoApprovalStatus = async (
  verifierAddress: string,
  status: boolean,
  chainId: number,
  signer: any, // Use a more specific type if available, e.g., JsonRpcSigner
): Promise<void> => {
  try {
    const contractAddresses = getContractAddresses(chainId)
    const carbonRetireContract = new Contract(contractAddresses.CARBON_RETIRE, CarbonRetireABI, signer)
    const tx = await carbonRetireContract.setAutoApproval(verifierAddress, status)
    await tx.wait()
    console.log(`Auto-approval for ${verifierAddress} set to ${status}`)
  } catch (error) {
    console.error("Error setting auto-approval status:", error)
    throw error
  }
}
