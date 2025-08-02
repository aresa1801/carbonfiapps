// Utility functions for wallet detection and connection

export type WalletType = "metamask" | "walletconnect" | "trustwallet" | "coinbase" | "brave" | "unknown"

export interface WalletInfo {
  type: WalletType
  name: string
  icon: string
  installed: boolean
  mobile: boolean
  description: string
}

// Detect if the user is on a mobile device
export function isMobile(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Detect if the user is on iOS
export function isIOS(): boolean {
  if (typeof window === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Detect if the user is on Android
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false
  return /Android/i.test(navigator.userAgent)
}

// Detect if the user is in an in-app browser
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent
  return (
    /FBAN|FBAV|Instagram|Twitter|WeChat|Line|FB_IAB|FB4A|FBAN/.test(ua) || // Social media apps
    /SamsungBrowser|MiuiBrowser/.test(ua) || // Samsung/Xiaomi browsers
    (/Android/.test(ua) && /wv/.test(ua)) // Android WebView
  )
}

// Get the type of in-app browser
export function getInAppBrowserType(): string {
  if (typeof window === "undefined") return "unknown"
  const ua = navigator.userAgent

  if (/FBAN|FBAV|FB_IAB|FB4A/.test(ua)) return "Facebook"
  if (/Instagram/.test(ua)) return "Instagram"
  if (/Twitter/.test(ua)) return "Twitter"
  if (/WeChat/.test(ua)) return "WeChat"
  if (/Line/.test(ua)) return "Line"
  if (/SamsungBrowser/.test(ua)) return "Samsung"
  if (/MiuiBrowser/.test(ua)) return "Xiaomi"

  return "unknown"
}

// Detect if the user is on a mobile device
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Get the MetaMask provider
export function getMetaMaskProvider(): any {
  if (typeof window === "undefined") return null

  const ethereum = window.ethereum

  if (!ethereum) return null

  // If ethereum is MetaMask, return it
  if (ethereum.isMetaMask) return ethereum

  // If ethereum has providers, find MetaMask
  if (ethereum.providers) {
    const metaMaskProvider = ethereum.providers.find((p: any) => p.isMetaMask)
    if (metaMaskProvider) return metaMaskProvider
  }

  return null
}

// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return !!getMetaMaskProvider()
}

// Get available wallets based on device and installed extensions
export function getAvailableWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = []
  const isMobile = isMobileDevice()
  const inAppBrowser = isInAppBrowser()

  // MetaMask
  wallets.push({
    type: "metamask",
    name: "MetaMask",
    icon: "/images/wallets/metamask.png",
    installed: isMetaMaskInstalled(),
    mobile: isMobile,
    description: "Connect to your MetaMask Wallet",
  })

  // WalletConnect (always available as fallback)
  wallets.push({
    type: "walletconnect",
    name: "WalletConnect",
    icon: "/images/wallets/walletconnect.png",
    installed: true,
    mobile: true,
    description: "Connect with QR code or deep link",
  })

  // Trust Wallet (primarily for mobile)
  if (isMobile) {
    wallets.push({
      type: "trustwallet",
      name: "Trust Wallet",
      icon: "/images/wallets/trustwallet.png",
      installed: getInAppBrowserType() === "Trust Wallet",
      mobile: true,
      description: "Connect to your Trust Wallet",
    })
  }

  // Coinbase Wallet
  wallets.push({
    type: "coinbase",
    name: "Coinbase Wallet",
    icon: "/images/wallets/coinbase.png",
    installed: getInAppBrowserType() === "Coinbase Wallet",
    mobile: true,
    description: "Connect to your Coinbase Wallet",
  })

  return wallets
}

// Check if a mobile wallet is available
export function isMobileWalletAvailable(): boolean {
  if (typeof window === "undefined") return false
  return !!window.ethereum
}

// Format an Ethereum address for display
export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// Auto connect to MetaMask if available
export async function autoConnectToMetaMask(): Promise<string | null> {
  try {
    const provider = getMetaMaskProvider()
    if (!provider) return null

    const accounts = await provider.request({ method: "eth_requestAccounts" })
    if (accounts && accounts.length > 0) {
      return accounts[0]
    }
    return null
  } catch (error) {
    console.error("Error auto-connecting to MetaMask:", error)
    return null
  }
}

// Get the current chain ID
export async function getChainId(): Promise<string | null> {
  try {
    const provider = getMetaMaskProvider()
    if (!provider) return null

    const chainId = await provider.request({ method: "eth_chainId" })
    return chainId
  } catch (error) {
    console.error("Error getting chain ID:", error)
    return null
  }
}

// Switch to a specific chain
export async function switchChain(chainId: string): Promise<boolean> {
  try {
    const provider = getMetaMaskProvider()
    if (!provider) return false

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    })
    return true
  } catch (error) {
    console.error("Error switching chain:", error)
    return false
  }
}

// Add a chain to MetaMask
export async function addChain(chainParams: any): Promise<boolean> {
  try {
    const provider = getMetaMaskProvider()
    if (!provider) return false

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    })
    return true
  } catch (error) {
    console.error("Error adding chain:", error)
    return false
  }
}
