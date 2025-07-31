"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface FaucetStatCardProps {
  title: string
  value: string
  isLoading: boolean
  subtitle?: string
}

export function FaucetStatCard({ title, value, isLoading, subtitle }: FaucetStatCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-800/50">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-gray-400">{title}</div>
        <div className="mt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-gray-700" />
          ) : (
            <div className="text-2xl font-bold text-white">{value}</div>
          )}
        </div>
        {subtitle && <div className="mt-1 text-xs text-gray-400">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}
