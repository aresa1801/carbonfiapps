import { contractService } from "@/lib/contract-utils"
import { toast } from "@/hooks/use-toast"

export async function getAutoApprovalStatus() {
  try {
    const carbonRetireContract = await contractService.getCarbonRetireContract()
    const status = await carbonRetireContract.autoApprovalEnabled()
    return status
  } catch (error) {
    console.error("Error fetching auto-approval status:", error)
    toast({
      title: "Error",
      description: "Failed to fetch auto-approval status.",
      variant: "destructive",
    })
    return false
  }
}

export async function toggleAutoApproval(currentStatus: boolean) {
  try {
    const carbonRetireContract = await contractService.getCarbonRetireContract(true)
    const tx = await carbonRetireContract.toggleAutoApproval()
    await tx.wait()
    toast({
      title: "Success",
      description: `Auto-approval ${currentStatus ? "disabled" : "enabled"} successfully.`,
    })
    return true
  } catch (error: any) {
    console.error("Error toggling auto-approval:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to toggle auto-approval.",
      variant: "destructive",
    })
    return false
  }
}
