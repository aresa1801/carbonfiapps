"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import type { Verifier } from "@/services/contract-service"

export default function VerifiersPage() {
  const { faucetContract, isConnected, isAdmin, refreshBalances, setTransactionStatus } = useWeb3()
  const [verifierAddress, setVerifierAddress] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [verifiers, setVerifiers] = useState<Verifier[]>([])

  useEffect(() => {
    const fetchVerifiers = async () => {
      if (isConnected && faucetContract) {
        try {
          // This assumes a method to get all verifiers or iterate through them.
          // For a simple DApp, we might not have a direct way to list all.
          // If your contract has a way to list verifiers (e.g., an array of verifier addresses),
          // you would fetch them here. For now, we'll just show a placeholder.
          // Example: const verifierCount = await faucetContract.getVerifierCount();
          // For each i < verifierCount, fetch verifier address and status.
          setVerifiers([]) // Placeholder: no direct way to list all verifiers from ABI
        } catch (error) {
          console.error("Error fetching verifiers:", error)
          toast({
            title: "Error",
            description: "Failed to fetch verifier list.",
            variant: "destructive",
          })
          setVerifiers([])
        }
      } else {
        setVerifiers([])
      }
    }
    fetchVerifiers()
  }, [isConnected, faucetContract, refreshBalances])

  const handleSetVerifierApproval = async (address: string, approved: boolean) => {
    if (!faucetContract || !isAdmin) {
      toast({
        title: "Error",
        description: "Please connect wallet and ensure you are an admin.",
        variant: "destructive",
      })
      return
    }

    if (approved) {
      setIsApproving(true)
      setTransactionStatus({ hash: null, status: "pending", message: `Approving verifier ${address}...` })
    } else {
      setIsRevoking(true)
      setTransactionStatus({ hash: null, status: "pending", message: `Revoking verifier ${address}...` })
    }

    try {
      const tx = await faucetContract.setVerifierApproval(address, approved)
      await tx.wait()
      setTransactionStatus({
        hash: tx.hash,
        status: "success",
        message: `Verifier ${address} ${approved ? "approved" : "revoked"} successfully!`,
      })
      toast({
        title: "Success",
        description: `Verifier ${address} ${approved ? "approved" : "revoked"}.`,
      })
      setVerifierAddress("")
      refreshBalances() // Trigger re-fetch of verifiers (if implemented)
    } catch (error: any) {
      console.error("Error setting verifier approval:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Failed to update verifier: ${error.reason || error.message}`,
      })
      toast({
        title: "Update Failed",
        description: `Failed to update verifier: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
      setIsRevoking(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to manage verifiers.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Manage Verifiers</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add/Update Verifier</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="verifier-address">Verifier Wallet Address</Label>
            <Input
              id="verifier-address"
              placeholder="Enter verifier address"
              value={verifierAddress}
              onChange={(e) => setVerifierAddress(e.target.value)}
              disabled={isApproving || isRevoking}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSetVerifierApproval(verifierAddress, true)}
              disabled={isApproving || !verifierAddress}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...
                </>
              ) : (
                "Approve Verifier"
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSetVerifierApproval(verifierAddress, false)}
              disabled={isRevoking || !verifierAddress}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revoking...
                </>
              ) : (
                "Revoke Verifier"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Verifiers</CardTitle>
        </CardHeader>
        <CardContent>
          {verifiers.length === 0 ? (
            <p className="text-muted-foreground">No verifiers found. Add a verifier above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiers.map((verifier, index) => (
                  <TableRow key={index}>
                    <TableCell>{verifier.wallet}</TableCell>
                    <TableCell>{verifier.isActive ? "Approved" : "Revoked"}</TableCell>
                    <TableCell>
                      <Button
                        variant={verifier.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleSetVerifierApproval(verifier.wallet, !verifier.isActive)}
                        disabled={isApproving || isRevoking}
                      >
                        {verifier.isActive ? "Revoke" : "Approve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Note: This list is illustrative. A real-world implementation would require a contract method to retrieve all
            verifiers or an off-chain indexer.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
