import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verifier Management - CAFI Smart Contract Tester",
  description: "Manage verifiers for carbon credit validation",
}

export default function VerifiersLayout({ children }) {
  return <>{children}</>
}
