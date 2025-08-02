"use client"

import { useState, useEffect } from "react"

export function useOrigin() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
