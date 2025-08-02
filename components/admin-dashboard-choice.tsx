"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface AdminDashboardChoiceProps {
  title: string
  description: string
  href: string
}

export function AdminDashboardChoice({ title, description, href }: AdminDashboardChoiceProps) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
