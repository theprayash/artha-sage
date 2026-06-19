import { getSettings } from '@/lib/actions/settings'
import SettingsClient from './_components/SettingsClient'
import { db } from '@/lib/db'
import { adminUsers } from '@/lib/db/schema'

export default async function AdminSettingsPage() {
  const [settings, admins] = await Promise.all([
    getSettings(),
    db.select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name }).from(adminUsers),
  ])

  const gmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  const nextauthConfigured = !!process.env.NEXTAUTH_SECRET
  const adminEmail = admins[0]?.email ?? ''
  const adminName = admins[0]?.name ?? ''

  return (
    <SettingsClient
      initial={settings}
      gmailConfigured={gmailConfigured}
      nextauthConfigured={nextauthConfigured}
      adminEmail={adminEmail}
      adminName={adminName}
      authors={admins}
    />
  )
}
