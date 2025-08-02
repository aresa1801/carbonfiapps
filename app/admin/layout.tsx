import type React from "react"
import { AdminDashboardNav } from "@/components/admin-dashboard-nav"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { AdminGuard } from "@/components/admin-guard"

interface AdminLayoutProps {
  children: React.ReactNode
}

const sidebarNavItems = [
  {
    title: "Admin Dashboard",
    href: "/admin",
  },
  {
    title: "Token Configuration",
    href: "/admin/token-config",
  },
  {
    title: "Faucet Settings",
    href: "/admin/faucet-settings",
  },
  {
    title: "Staking Pool",
    href: "/admin/staking-pool",
  },
  {
    title: "Farming Pool",
    href: "/admin/farming",
  },
  {
    title: "NFT Settings",
    href: "/admin/nft-settings",
  },
  {
    title: "Verifiers",
    href: "/admin/verifiers",
  },
  {
    title: "Retire Settings",
    href: "/admin/retire-settings",
  },
  {
    title: "Contract Addresses",
    href: "/admin/contract-addresses",
  },
  {
    title: "Contract Migration",
    href: "/admin/contract-migration",
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <MobileOptimizedLayout>
        <div className="flex-1 flex-col space-y-8 p-8 md:flex">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
              <p className="text-muted-foreground">Manage CarbonFi DApp configurations and contracts.</p>
            </div>
          </div>
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <aside className="-mx-4 lg:w-1/5">
              <AdminDashboardNav items={sidebarNavItems} />
            </aside>
            <div className="flex-1 lg:max-w-full">{children}</div>
          </div>
        </div>
      </MobileOptimizedLayout>
    </AdminGuard>
  )
}
