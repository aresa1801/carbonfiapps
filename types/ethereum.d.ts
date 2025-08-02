import type { MetaMaskInpageProvider } from "@metamask/providers"
import type { Eip1193Provider } from "ethers"

interface Window {
  ethereum?: MetaMaskInpageProvider &
    Eip1193Provider & {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      isRabby?: boolean
      isTrust?: boolean
      providers?: any[] // For multiple wallet detection
      chainId?: string // Add chainId property
      selectedAddress: string | null
    }
}
