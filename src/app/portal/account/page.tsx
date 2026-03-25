import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Shield, CreditCard, Mail, Sparkles } from 'lucide-react'

export const metadata = { title: 'Môj Účet | PROJECTBer' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return <div>Profil sa nenašiel.</div>

  const planLabels: Record<string, string> = {
    free: 'Základný (Free)',
    pro: 'Pokročilý (Pro)',
    enterprise: 'Produkčný (Enterprise)'
  }

  const roleLabels: Record<string, string> = {
    user: 'Bežný používateľ',
    admin: 'Administrátor',
    superadmin: 'Hlavný administrátor (Superadmin)'
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 60, paddingTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={28} color="var(--brand)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Môj Účet</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Základné nastavenia a informácie o vašom profile
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Mail size={18} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Prihlasovací e-mail</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Shield size={18} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Používateľská rola</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{roleLabels[profile.role] || profile.role}</div>
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <CreditCard size={18} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Aktuálny plán</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, background: 'var(--brand-bg)', color: 'var(--brand)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
              {(profile.role === 'superadmin' || profile.role === 'admin') ? 'UNLIMITED' : (planLabels[profile.plan] || profile.plan?.toUpperCase() || 'FREE')}
            </div>
            {profile.role !== 'superadmin' && profile.role !== 'admin' && (
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
                Ak si želáte navýšiť váš plán, kontaktujte prosím svojho administrátora.
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Sparkles size={18} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Spotreba AI Tokenov</div>
            {profile.role === 'admin' || profile.role === 'superadmin' ? (
               <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Neobmedzené (Unlimited)</div>
            ) : profile.plan === 'free' ? (
               <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>Nek dispozícii (Plán Free nezahŕňa AI tokeny)</div>
            ) : (
               <div style={{ marginTop: 8 }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                   <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{profile.tokens_used} <span style={{ color: 'var(--text-muted)' }}>/ {profile.tokens_limit}</span></span>
                   <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Obnovenie: 1. v mesiaci</span>
                 </div>
                 <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (profile.tokens_used / Math.max(1, profile.tokens_limit)) * 100)}%`, 
                      height: '100%', 
                      background: profile.tokens_used >= profile.tokens_limit ? 'var(--error)' : 'var(--brand)',
                      transition: 'width 300ms ease-out'
                    }} />
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
