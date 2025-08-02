import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verifiers | CarbonFi Admin",
  description: "Manage verifiers for CarbonFi.",
}

export default function VerifiersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
