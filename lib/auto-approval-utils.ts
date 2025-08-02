// Utility functions for auto-approval settings
export const getAutoApprovalSetting = (): boolean => {
  if (typeof window === "undefined") return false

  const savedSetting = localStorage.getItem("autoApprovalEnabled")
  return savedSetting ? JSON.parse(savedSetting) : false
}

export const setAutoApprovalSetting = (enabled: boolean): void => {
  if (typeof window === "undefined") return

  localStorage.setItem("autoApprovalEnabled", JSON.stringify(enabled))
}

export const isAutoApprovalEnabled = (): boolean => {
  return getAutoApprovalSetting()
}
