import { formatEther, parseEther } from "ethers"

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
}

export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  // Check for common in-app browser indicators
  return (
    (window as any).ethereum &&
    (userAgent.includes("MetaMask") ||
      userAgent.includes("CoinbaseWallet") ||
      userAgent.includes("TrustWallet") ||
      userAgent.includes("BinanceWallet") ||
      userAgent.includes("Brave") ||
      userAgent.includes("Opera Touch") ||
      userAgent.includes("CriOS") || // Chrome on iOS
      userAgent.includes("FxiOS") || // Firefox on iOS
      userAgent.includes("EdgiOS") || // Edge on iOS
      userAgent.includes("SamsungBrowser") ||
      userAgent.includes("wv") || // WebView on Android
      userAgent.includes("FBAN") || // Facebook in-app browser
      userAgent.includes("FBAV") || // Facebook in-app browser
      userAgent.includes("Instagram") ||
      userAgent.includes("Line") ||
      userAgent.includes("KakaoTalk") ||
      userAgent.includes("WeChat") ||
      userAgent.includes("Alipay") ||
      userAgent.includes("DingTalk") ||
      userAgent.includes("Quark") ||
      userAgent.includes("UCBrowser") ||
      userAgent.includes("Puffin") ||
      userAgent.includes("MiuiBrowser") ||
      userAgent.includes("VivoBrowser") ||
      userAgent.includes("HuaweiBrowser"))
  )
}

export function getInAppBrowserType(): string {
  if (typeof window === "undefined") return "Unknown"
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  if (userAgent.includes("MetaMask")) return "MetaMask In-App"
  if (userAgent.includes("CoinbaseWallet")) return "Coinbase Wallet In-App"
  if (userAgent.includes("TrustWallet")) return "Trust Wallet In-App"
  if (userAgent.includes("BinanceWallet")) return "Binance Wallet In-App"
  if (userAgent.includes("Brave")) return "Brave Browser"
  if (userAgent.includes("Opera Touch")) return "Opera Touch"
  if (userAgent.includes("CriOS")) return "Chrome (iOS)"
  if (userAgent.includes("FxiOS")) return "Firefox (iOS)"
  if (userAgent.includes("EdgiOS")) return "Edge (iOS)"
  if (userAgent.includes("SamsungBrowser")) return "Samsung Browser"
  if (userAgent.includes("wv")) return "Android WebView"
  if (userAgent.includes("FBAN") || userAgent.includes("FBAV")) return "Facebook In-App"
  if (userAgent.includes("Instagram")) return "Instagram In-App"
  if (userAgent.includes("Line")) return "Line In-App"
  if (userAgent.includes("KakaoTalk")) return "KakaoTalk In-App"
  if (userAgent.includes("WeChat")) return "WeChat In-App"
  if (userAgent.includes("Alipay")) return "Alipay In-App"
  if (userAgent.includes("DingTalk")) return "DingTalk In-App"
  if (userAgent.includes("Quark")) return "Quark Browser"
  if (userAgent.includes("UCBrowser")) return "UC Browser"
  if (userAgent.includes("Puffin")) return "Puffin Browser"
  if (userAgent.includes("MiuiBrowser")) return "Miui Browser"
  if (userAgent.includes("VivoBrowser")) return "Vivo Browser"
  if (userAgent.includes("HuaweiBrowser")) return "Huawei Browser"

  return "Generic In-App Browser"
}

export const formatWalletAddress = (address: string | null | undefined) => {
  if (!address) return "N/A"
  return `${address.substring(0, 6)}...${address.slice(-4)}`
}

export const formatBigIntToEther = (value: bigint | null | undefined) => {
  if (value === null || value === undefined) return "0.0"
  return formatEther(value)
}

export const parseEtherToBigInt = (value: string) => {
  try {
    return parseEther(value)
  } catch (error) {
    console.error("Error parsing ether amount:", error)
    return BigInt(0)
  }
}
