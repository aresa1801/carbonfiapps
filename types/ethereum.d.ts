interface Window {
  ethereum?: import("ethers").Eip1193Provider & {
    isMetaMask?: boolean
    isCoinbaseWallet?: boolean
    isRabby?: boolean
    isTrust?: boolean
    providers?: any[] // For multiple wallet detection
  }
}
