import { ProfilePage } from '../../member/pages/ProfilePage.jsx'
import { SecurityPage } from '../../member/pages/SecurityPage.jsx'

export function AdminProfilePage() {
  return (
    <div className="grid gap-10">
      <ProfilePage />
      <SecurityPage />
    </div>
  )
}
