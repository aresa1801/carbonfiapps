"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface DashboardChoiceCardProps {
  title: string
  description: string
  href: string
}

function DashboardChoiceCard({ title, description, href }: DashboardChoiceCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href} passHref>
          <Button className="w-full">
            Go to {title}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export function AdminDashboardChoice() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashboardChoiceCard
        title="Token Configuration"
        description="Manage CAFI token properties like minting, burning, and transfers."
        href="/admin/token-config"
      />
      <DashboardChoiceCard
        title="Faucet Settings"
        description="Configure faucet claim amounts and intervals."
        href="/admin/faucet-settings"
      />
      <DashboardChoiceCard
        title="Staking Pool Settings"
        description="Adjust staking reward rates and manage the staking pool."
        href="/admin/staking-pool"
      />
      <DashboardChoiceCard
        title="Farming Pool Settings"
        description="Adjust farming reward rates and manage the farming pool."
        href="/admin/farming"
      />
      <DashboardChoiceCard
        title="NFT Settings"
        description="Manage NFT contract properties and base URI."
        href="/admin/nft-settings"
      />
      <DashboardChoiceCard
        title="Verifier Management"
        description="Add or remove verifiers for carbon retirement."
        href="/admin/verifiers"
      />
      <DashboardChoiceCard
        title="Retire Settings"
        description="Manage auto-approval settings for verifiers in carbon retirement."
        href="/admin/retire-settings"
      />
      <DashboardChoiceCard
        title="Contract Addresses"
        description="View and manage deployed contract addresses."
        href="/admin/contract-addresses"
      />
      <DashboardChoiceCard
        title="Contract Migration"
        description="Tools for migrating contracts to new versions."
        href="/admin/contract-migration"
      />
    </div>
  )
}
