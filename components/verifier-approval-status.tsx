"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { contractService } from "@/services/contract-service"
import { CheckCircle2, Clock } from "lucide-react"

interface VerifierApprovalStatusProps {
  tokenId: string
  approvals: Array<{ verifier: string; approved: boolean }>
  isAutoApprovalEnabled?: boolean
}

export function VerifierApprovalStatus({
  tokenId,
  approvals: initialApprovals,
  isAutoApprovalEnabled = false,
}: VerifierApprovalStatusProps) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const [isLoading, setIsLoading] = useState(true)
  const [verifiers, setVerifiers] = useState<Array<{ name: string; wallet: string; isActive: boolean }>>([])

  useEffect(() => {
    if (tokenId) {
      loadVerifiersAndApprovals()
    }
  }, [tokenId])

  const loadVerifiersAndApprovals = async () => {
    try {
      setIsLoading(true)
      const nftContract = await contractService.getNftContract()
      const verifiersList = []
      const approvalsList = []

      // Try to load verifiers from index 0 to 9 (adjust as needed)
      for (let i = 0; i < 10; i++) {
        try {
          const verifier = await nftContract.getVerifier(i)
          if (verifier && verifier.wallet !== "0x0000000000000000000000000000000000000000") {
            verifiersList.push({
              name: verifier.name,
              wallet: verifier.wallet,
              isActive: verifier.isActive,
            })

            // Check if this verifier has approved the token
            const isApproved = await nftContract.isApprovedByVerifier(tokenId, verifier.wallet)
            approvalsList.push({
              verifier: verifier.name,
              wallet: verifier.wallet,
              approved: isApproved,
            })
          }
        } catch (error) {
          // Stop when we can't get more verifiers
          break
        }
      }

      setVerifiers(verifiersList)
      setApprovals(approvalsList)
    } catch (error) {
      console.error("Error loading verifiers and approvals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Loading approval status...</span>
      </div>
    )
  }

  if (isAutoApprovalEnabled) {
    return (
      <div className="flex items-center space-x-2">
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Auto-Approved
        </Badge>
      </div>
    )
  }

  const approvedCount = approvals.filter((a) => a.approved).length
  const pendingCount = approvals.length - approvedCount

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {approvedCount > 0 && (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {approvedCount} Approved
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
          >
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {approvals.map((approval, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{approval.verifier}</span>
            {approval.approved ? (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </span>
            ) : (
              <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default VerifierApprovalStatus
