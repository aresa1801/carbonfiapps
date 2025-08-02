import type React from "react"
import { MobileOptimizedLayout } from "@/components/mobile-optimized-layout"
import { UserDashboardNav } from "@/components/user-dashboard-nav"

interface UserLayoutProps {
  children: React.ReactNode
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/user",
  },
  {
    title: "Faucet",
    href: "/user/faucet",
  },
  {
    title: "Staking",
    href: "/user/staking",
  },
  {
    title: "Farming",
    href: "/user/farming",
  },
  {
    title: "Retire Carbon",
    href: "/user/retire",
  },
  {
    title: "Mint NFT",
    href: "/user/mint-nft",
  },
  {
    title: "Marketplace",
    href: "/user/marketplace",
  },
]

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <MobileOptimizedLayout>
      <div className="flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Dashboard</h2>
            <p className="text-muted-foreground">Manage your CarbonFi assets and participate in DApp features.</p>
          </div>
        </div>
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <UserDashboardNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-full">{children}</div>
        </div>
      </div>
    </MobileOptimizedLayout>
  )
}
