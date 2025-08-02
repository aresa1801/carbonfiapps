"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface UserDashboardNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    disabled?: boolean
  }[]
}

export function UserDashboardNav({ className, items, ...props }: UserDashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            "justify-start",
            item.disabled && "cursor-not-allowed opacity-80",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
