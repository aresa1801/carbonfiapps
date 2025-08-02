import type { MetaMaskInpageProvider } from "@metamask/providers"

interface Window {
  ethereum?: MetaMaskInpageProvider &
    import("ethers").Eip1193Provider & {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      isRabby?: boolean
      isTrust?: boolean
      providers?: any[] // For multiple wallet detection
      chainId?: string // Add chainId property
      selectedAddress: string | null
    }
}
