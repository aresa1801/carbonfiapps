"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { usePathname } from "next/navigation"
import { UserDashboardNav } from "@/components/user-dashboard-nav"
import { AdminDashboardNav } from "@/components/admin-dashboard-nav"

export function DashboardHeader() {
  const { isAdmin } = useWeb3()
  const pathname = usePathname()

  const isUserPath = pathname.startsWith("/user")
  const isAdminPath = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Image
                src="/images/carbonfi-logo.png"
                alt="CarbonFi Logo"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="sr-only">CarbonFi</span>
            </Link>
            {isAdminPath ? <AdminDashboardNav /> : <UserDashboardNav />}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search or other elements can go here */}
      </div>
      <div className="flex items-center gap-2 md:ml-auto md\
