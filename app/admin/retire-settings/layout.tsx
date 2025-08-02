import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Retire Settings | CarbonFi Admin",
  description: "Manage Carbon Retirement settings for CarbonFi.",
}

export default function RetireSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
