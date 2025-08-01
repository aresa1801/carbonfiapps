import { ContractAddressesDisplay } from "@/components/contract-addresses-display"

const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard">
      {/* Existing admin cards */}
      <div className="card">Card 1</div>
      <div className="card">Card 2</div>
      <div className="card">Card 3</div>

      {/* Add after the existing admin cards */}
      <div className="mt-6">
        <ContractAddressesDisplay />
      </div>
    </div>
  )
}

export default AdminDashboardPage
