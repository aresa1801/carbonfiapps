"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useWeb3 } from "@/components/web3-provider"
import { useEffect, useState } from "react"
import { getCafiBalance } from "@/lib/contract-service"

export function FaucetStatCard() {
  const { faucetContract, cafiTokenContract, isConnected, address } = useWeb3()
  const [faucetBalance, setFaucetBalance] = useState("0")

  useEffect(() => {
    const fetchFaucetBalance = async () => {
      if (faucetContract && cafiTokenContract && isConnected && address) {
        try {
          const balance = await getCafiBalance(cafiTokenContract, await faucetContract.getAddress())
          setFaucetBalance(balance)
        } catch (error) {
          console.error("Error fetching faucet balance:", error)
          setFaucetBalance("Error")
        }
      }
    }
    fetchFaucetBalance()
  }, [faucetContract, cafiTokenContract, isConnected, address])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faucet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{faucetBalance} CAFI</p>
        <p className="text-sm text-muted-foreground">Tokens available in the faucet for claiming.</p>
      </CardContent>
    </Card>
  )
}
