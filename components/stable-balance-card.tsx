"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"

export function StableBalanceCard() {
  const { cafiBalance } = useWeb3()

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAFI Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{cafiBalance} CAFI</p>
        <p className="text-sm text-muted-foreground">Your CarbonFi Token balance.</p>
      </CardContent>
    </Card>
  )
}
