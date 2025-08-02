import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Retire Settings - CAFI Smart Contract Tester",
  description: "Configure retirement settings for carbon credits",
}

export default function RetireSettingsLayout({ children }) {
  return <>{children}</>
}
