"use client"

import { Home, DollarSign, Gem, Recycle, Store, Settings, ShieldCheck, BarChart3, Factory } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useWeb3 } from "@/components/web3-provider"

// Menu items.
const userItems = [
  {
    title: "Dashboard",
    url: "/user",
    icon: Home,
  },
  {
    title: "Faucet",
    url: "/user/faucet",
    icon: DollarSign,
  },
  {
    title: "Staking",
    url: "/user/staking",
    icon: Gem,
  },
  {
    title: "Farming",
    url: "/user/farming",
    icon: Factory,
  },
  {
    title: "Retire Carbon",
    url: "/user/retire",
    icon: Recycle,
  },
  {
    title: "Mint NFT",
    url: "/user/mint-nft",
    icon: Gem,
  },
  {
    title: "Marketplace",
    url: "/user/marketplace",
    icon: Store,
  },
]

const adminItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: BarChart3,
  },
  {
    title: "Token Config",
    url: "/admin/token-config",
    icon: Settings,
  },
  {
    title: "Faucet Settings",
    url: "/admin/faucet-settings",
    icon: Settings,
  },
  {
    title: "Staking Pool",
    url: "/admin/staking-pool",
    icon: Settings,
  },
  {
    title: "Farming Pool",
    url: "/admin/farming",
    icon: Settings,
  },
  {
    title: "NFT Settings",
    url: "/admin/nft-settings",
    icon: Settings,
  },
  {
    title: "Verifiers",
    url: "/admin/verifiers",
    icon: ShieldCheck,
  },
  {
    title: "Retire Settings",
    url: "/admin/retire-settings",
    icon: Settings,
  },
  {
    title: "Contract Addresses",
    url: "/admin/contract-addresses",
    icon: Settings,
  },
  {
    title: "Contract Migration",
    url: "/admin/contract-migration",
    icon: Settings,
  },
]

interface DashboardSidebarProps {
  isMobileSheet?: boolean
}

export function DashboardSidebar({ isMobileSheet = false }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isAdmin } = useWeb3()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {isMobileSheet && (
          <div className="flex items-center justify-between p-2">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/images/carbonfi-logo.png" alt="CarbonFi Logo" width={32} height={32} className="h-8 w-8" />
              <span className="font-bold">CarbonFi</span>
            </Link>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>User DApps</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
