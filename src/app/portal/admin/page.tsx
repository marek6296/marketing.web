import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin Panel | PROJECTBer' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify access
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!myProfile || (myProfile.role !== 'admin' && myProfile.role !== 'superadmin')) {
    redirect('/portal/dashboard')
  }

  const isSuperAdmin = myProfile.role === 'superadmin'

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !profiles) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--error)' }}>Chyba pri načítavaní údajov o používateľoch.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={22} color="var(--brand)" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Správa používateľov a systémových obmedzení
          </p>
        </div>
      </div>
      
      <AdminClient profiles={profiles} isSuperAdmin={isSuperAdmin} currentUserEmail={user.email} />
    </div>
  )
}
