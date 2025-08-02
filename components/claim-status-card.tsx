"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ClaimStatusCardProps {
  isLoading: boolean
  hasClaimedToday: boolean
  remainingQuota: string
}

export function ClaimStatusCard({ isLoading, hasClaimedToday, remainingQuota }: ClaimStatusCardProps) {
  const canClaim = !hasClaimedToday && Number(remainingQuota) > 0

  return (
    <Card className="border-gray-700 bg-gray-900 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">Claim Status</div>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-gray-700" />
          ) : (
            <div className="flex items-center">
              {canClaim ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                  <span className="text-lg font-medium text-emerald-400">Ready to claim</span>
                </>
              ) : hasClaimedToday ? (
                <>
                  <Clock className="mr-2 h-5 w-5 text-orange-500" />
                  <span className="text-lg font-medium text-orange-400">Already claimed today</span>
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  <span className="text-lg font-medium text-red-400">No tokens available</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {canClaim ? "Daily limit available" : hasClaimedToday ? "Try again tomorrow" : "Faucet depleted"}
        </div>
      </CardContent>
    </Card>
  )
}
