"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function AdminDashboardChoice() {
  const router = useRouter()
  const [hasMadeChoice, setHasMadeChoice] = useState(false)

  useEffect(() => {
    const choice = sessionStorage.getItem("dashboard-choice")
    if (choice) {
      setHasMadeChoice(true)
      router.replace(choice) // Redirect immediately if choice exists
    }
  }, [router])

  const handleChoice = (path: string) => {
    sessionStorage.setItem("dashboard-choice", path)
    setHasMadeChoice(true)
    router.push(path)
  }

  if (hasMadeChoice) {
    return null // Don't render anything if a choice has been made and redirecting
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md bg-gray-900 text-white shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-400">Choose Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-center">Please select which dashboard you would like to access.</p>
          <Button
            onClick={() => handleChoice("/admin/retire-settings")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
          >
            Retire Settings
          </Button>
          <Button
            onClick={() => handleChoice("/admin/nft-settings")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2"
          >
            NFT Settings
          </Button>
          <Button
            onClick={() => handleChoice("/admin/verifiers")}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2"
          >
            Verifiers
          </Button>
          <Button
            onClick={() => handleChoice("/admin/staking-pool")}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2"
          >
            Staking Pool
          </Button>
          <Button
            onClick={() => handleChoice("/admin/farming")}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2"
          >
            Farming Pool
          </Button>
          <Button
            onClick={() => handleChoice("/admin/token-config")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2"
          >
            Token Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
