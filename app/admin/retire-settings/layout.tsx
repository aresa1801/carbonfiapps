import type React from "react"
import { AdminGuard } from "@/components/admin-guard"

export default function AdminRetireSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminGuard>{children}</AdminGuard>
}
