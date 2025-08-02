"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, User, Shield } from "lucide-react"

interface AdminDashboardChoiceProps {
  isOpen?: boolean
  onClose?: () => void
  onChoice?: (choice: "admin" | "user") => void
}

export function AdminDashboardChoice({ isOpen, onClose, onChoice }: AdminDashboardChoiceProps = {}) {
  const { isConnected, isAdmin, account } = useWeb3()
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isConnected && isAdmin && account) {
      // Check if user has already made a choice this session
      const dashboardChoice = sessionStorage.getItem("dashboard-choice")

      if (!dashboardChoice) {
        setShowModal(true)
      }
    }
  }, [isConnected, isAdmin, account])

  const handleChoice = (choice: "admin" | "user") => {
    sessionStorage.setItem("dashboard-choice", choice)
    setShowModal(false)

    if (onChoice) {
      onChoice(choice)
    } else {
      router.push(choice === "admin" ? "/admin" : "/user")
    }

    if (onClose) {
      onClose()
    }
  }

  const isModalOpen = isOpen !== undefined ? isOpen : showModal

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose || (() => setShowModal(false))}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Admin Access Detected
          </DialogTitle>
          <DialogDescription>
            You're connected with an admin wallet. Choose which dashboard you'd like to access.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-emerald-500"
            onClick={() => handleChoice("admin")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <Settings className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-lg">Admin Dashboard</CardTitle>
              <CardDescription>Manage contracts, settings, and system administration</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contract Management</li>
                <li>• Faucet Administration</li>
                <li>• NFT & Staking Settings</li>
                <li>• System Configuration</li>
              </ul>
              <Button className="w-full mt-4" onClick={() => handleChoice("admin")}>
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
            onClick={() => handleChoice("user")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">User Dashboard</CardTitle>
              <CardDescription>Access user features and interact with the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mint Carbon NFTs</li>
                <li>• Staking & Farming</li>
                <li>• Marketplace Trading</li>
                <li>• Carbon Retirement</li>
              </ul>
              <Button variant="outline" className="w-full mt-4" onClick={() => handleChoice("user")}>
                Go to User Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="sm" onClick={onClose || (() => setShowModal(false))}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
