"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWeb3 } from "@/components/web3-provider"
import { formatEther, parseEther } from "ethers"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import type { NFTListing } from "@/services/contract-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function MarketplacePage() {
  const { marketplaceContract, nftContract, address, isConnected, refreshBalances, setTransactionStatus } = useWeb3()

  const [listings, setListings] = useState<NFTListing[]>([])
  const [tokenIdToList, setTokenIdToList] = useState("")
  const [amountToList, setAmountToList] = useState("")
  const [pricePerItem, setPricePerItem] = useState("")
  const [isListing, setIsListing] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [isUnlisting, setIsUnlisting] = useState(false)
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null)
  const [buyAmount, setBuyAmount] = useState("")

  useEffect(() => {
    const fetchListings = async () => {
      if (isConnected && marketplaceContract) {
        try {
          const count = await marketplaceContract.getListingCount()
          const fetchedListings: NFTListing[] = []
          for (let i = 0; i < count; i++) {
            const listing = await marketplaceContract.getListing(i)
            // Only add if amount > 0 (not fully sold)
            if (listing.amount > 0) {
              fetchedListings.push({
                seller: listing.seller,
                tokenId: listing.tokenId,
                amount: listing.amount,
                pricePerItem: listing.pricePerItem,
              })
            }
          }
          setListings(fetchedListings)
        } catch (error) {
          console.error("Error fetching marketplace listings:", error)
          toast({
            title: "Error",
            description: "Failed to fetch marketplace listings.",
            variant: "destructive",
          })
          setListings([])
        }
      } else {
        setListings([])
      }
    }
    fetchListings()
  }, [isConnected, marketplaceContract, refreshBalances])

  const handleListNFT = async () => {
    if (!marketplaceContract || !nftContract || !tokenIdToList || !amountToList || !pricePerItem || !address) {
      toast({
        title: "Error",
        description: "Please fill all listing fields and connect wallet.",
        variant: "destructive",
      })
      return
    }

    setIsListing(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Approving NFT for listing..." })
    try {
      const parsedTokenId = BigInt(tokenIdToList)
      const parsedAmount = BigInt(amountToList)
      const parsedPricePerItem = parseEther(pricePerItem)

      // Check NFT ownership and balance
      const nftBalance = await nftContract.balanceOf(address)
      if (nftBalance < parsedAmount) {
        throw new Error("Insufficient NFT balance to list this amount.")
      }

      // Approve NFT transfer to Marketplace contract
      const approveTx = await nftContract.approve(await marketplaceContract.getAddress(), parsedTokenId)
      await approveTx.wait()
      setTransactionStatus({ hash: approveTx.hash, status: "pending", message: "NFT approved. Listing NFT..." })

      // List NFT
      const listTx = await marketplaceContract.listNFT(parsedTokenId, parsedAmount, parsedPricePerItem)
      await listTx.wait()
      setTransactionStatus({ hash: listTx.hash, status: "success", message: "NFT listed successfully!" })
      toast({
        title: "Listing Successful",
        description: `NFT ID ${tokenIdToList} listed for ${amountToList} units at ${pricePerItem} ETH/BNB/HBAR per unit.`,
      })
      setTokenIdToList("")
      setAmountToList("")
      setPricePerItem("")
      refreshBalances()
    } catch (error: any) {
      console.error("Error listing NFT:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Listing failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Listing Failed",
        description: `Failed to list NFT: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsListing(false)
    }
  }

  const openBuyDialog = (listing: NFTListing) => {
    setSelectedListing(listing)
    setBuyAmount("")
    setIsBuyDialogOpen(true)
  }

  const handleBuyNFT = async () => {
    if (!marketplaceContract || !selectedListing || !buyAmount || !address) {
      toast({
        title: "Error",
        description: "Please enter amount to buy and connect wallet.",
        variant: "destructive",
      })
      return
    }

    setIsBuying(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Buying NFT..." })
    try {
      const amount = BigInt(buyAmount)
      if (amount <= 0 || amount > selectedListing.amount) {
        throw new Error(`Amount must be between 1 and ${selectedListing.amount}.`)
      }

      const totalPrice = amount * selectedListing.pricePerItem
      const tx = await marketplaceContract.buyNFT(
        listings.indexOf(selectedListing), // Use index as listingId
        amount,
        { value: totalPrice },
      )
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "NFT purchased successfully!" })
      toast({
        title: "Purchase Successful",
        description: `Successfully purchased ${buyAmount} units of NFT ID ${Number(selectedListing.tokenId)}.`,
      })
      setBuyAmount("")
      setIsBuyDialogOpen(false)
      refreshBalances()
    } catch (error: any) {
      console.error("Error buying NFT:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Purchase failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Purchase Failed",
        description: `Failed to purchase NFT: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsBuying(false)
    }
  }

  const handleUnlistNFT = async (listing: NFTListing) => {
    if (!marketplaceContract || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected or marketplace contract not loaded.",
        variant: "destructive",
      })
      return
    }

    if (listing.seller.toLowerCase() !== address.toLowerCase()) {
      toast({
        title: "Unauthorized",
        description: "You can only unlist your own NFTs.",
        variant: "destructive",
      })
      return
    }

    setIsUnlisting(true)
    setTransactionStatus({ hash: null, status: "pending", message: "Unlisting NFT..." })
    try {
      const listingId = listings.indexOf(listing)
      const tx = await marketplaceContract.unlistNFT(listingId)
      await tx.wait()
      setTransactionStatus({ hash: tx.hash, status: "success", message: "NFT unlisted successfully!" })
      toast({
        title: "Unlist Successful",
        description: `NFT ID ${Number(listing.tokenId)} unlisted.`,
      })
      refreshBalances()
    } catch (error: any) {
      console.error("Error unlisting NFT:", error)
      setTransactionStatus({
        hash: error.hash || null,
        status: "failed",
        message: `Unlisting failed: ${error.reason || error.message}`,
      })
      toast({
        title: "Unlist Failed",
        description: `Failed to unlist NFT: ${error.reason || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUnlisting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Please connect your wallet to view the marketplace.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Carbon Credit NFT Marketplace</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>List Your NFT for Sale</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="list-token-id">NFT Token ID</Label>
            <Input
              id="list-token-id"
              type="number"
              placeholder="Enter NFT Token ID"
              value={tokenIdToList}
              onChange={(e) => setTokenIdToList(e.target.value)}
              disabled={isListing}
            />
          </div>
          <div>
            <Label htmlFor="amount-to-list">Amount (Units)</Label>
            <Input
              id="amount-to-list"
              type="number"
              placeholder="Enter amount to list"
              value={amountToList}
              onChange={(e) => setAmountToList(e.target.value)}
              disabled={isListing}
            />
          </div>
          <div>
            <Label htmlFor="price-per-item">Price Per Unit (ETH/BNB/HBAR)</Label>
            <Input
              id="price-per-item"
              type="number"
              placeholder="Enter price per unit"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              disabled={isListing}
            />
          </div>
          <Button onClick={handleListNFT} disabled={isListing}>
            {isListing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Listing...
              </>
            ) : (
              "List NFT"
            )}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Available Listings</h2>
      <Card>
        <CardHeader>
          <CardTitle>NFTs for Sale</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-muted-foreground">No NFTs currently listed for sale.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing ID</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price Per Unit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing, index) => (
                  <TableRow key={index}>
                    <TableCell>{index}</TableCell>
                    <TableCell>{listing.seller.substring(0, 6)}...</TableCell>
                    <TableCell>{Number(listing.tokenId)}</TableCell>
                    <TableCell>{Number(listing.amount)}</TableCell>
                    <TableCell>{formatEther(listing.pricePerItem)}</TableCell>
                    <TableCell className="space-x-2">
                      {listing.seller.toLowerCase() === address?.toLowerCase() ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnlistNFT(listing)}
                          disabled={isUnlisting}
                        >
                          {isUnlisting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlisting
                            </>
                          ) : (
                            "Unlist"
                          )}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => openBuyDialog(listing)} disabled={isBuying}>
                          Buy
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Carbon Credit NFT</DialogTitle>
            <DialogDescription>
              Purchase units of NFT ID {selectedListing ? Number(selectedListing.tokenId) : ""}.
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="grid gap-4 py-4">
              <div>
                <Label>Seller:</Label>
                <Input value={selectedListing.seller} readOnly />
              </div>
              <div>
                <Label>Available Amount:</Label>
                <Input value={Number(selectedListing.amount)} readOnly />
              </div>
              <div>
                <Label>Price Per Unit:</Label>
                <Input value={`${formatEther(selectedListing.pricePerItem)} ETH/BNB/HBAR`} readOnly />
              </div>
              <div>
                <Label htmlFor="buy-amount">Amount to Buy</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="1"
                  max={Number(selectedListing.amount)}
                />
              </div>
              <div>
                <Label>Total Price:</Label>
                <Input
                  value={`${
                    buyAmount ? formatEther(parseEther(buyAmount || "0") * selectedListing.pricePerItem) : "0.00"
                  } ETH/BNB/HBAR`}
                  readOnly
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuyNFT} disabled={isBuying}>
              {isBuying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buying
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
