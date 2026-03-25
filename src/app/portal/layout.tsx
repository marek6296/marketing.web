import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import {
  LayoutGrid,
  FolderKanban,
  LogOut,
  Sparkles,
  ChevronRight,
  BookOpen,
  Crown,
  Users,
  Wand2
} from 'lucide-react'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['800', '900'] })

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user.id)
    .single()
  const role = profile?.role || 'user'
  const isAdminOrSuperadmin = role === 'admin' || role === 'superadmin'

  return (
    <div className="portal-layout">
      <aside className="sidebar">
        {/* Brand logo */}
        <div style={{ padding: '32px 0px 24px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Link href="/portal/dashboard" style={{ textDecoration: 'none', display: 'block', width: '100%', textAlign: 'center' }}>
            <span className={montserrat.className} style={{ fontWeight: 900, fontSize: 28, color: '#FFF', letterSpacing: '-0.04em' }}>
              PROJECTBer
            </span>
          </Link>
        </div>

        {/* User card */}
        <div style={{ padding: '0 12px 12px' }}>
          <Link href="/portal/account" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Účet
                  <span style={{ 
                    padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: isAdminOrSuperadmin ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                    color: isAdminOrSuperadmin ? '#EAB308' : 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {isAdminOrSuperadmin ? role : profile?.plan || 'free'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                  {user.email}
                </div>
              </div>
              <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
            </div>
          </Link>
        </div>

        {/* Simplified navigation — only Dashboard + Projects */}
        <nav style={{ flex: 1, paddingTop: 4 }}>
          <div className="sidebar-section-label">Navigácia</div>
          <Link href="/portal/dashboard" className="sidebar-item">
            <LayoutGrid size={16} strokeWidth={1.8} />
            <span>Overview</span>
          </Link>
          <Link href="/portal/projects" className="sidebar-item">
            <FolderKanban size={16} strokeWidth={1.8} />
            <span>Projekty</span>
          </Link>
          <Link href="/portal/help/meta-setup" className="sidebar-item">
            <BookOpen size={16} strokeWidth={1.8} />
            <span>Sprievodca API</span>
          </Link>
          <Link href="/portal/prompts" className="sidebar-item">
            <Wand2 size={16} strokeWidth={1.8} />
            <span>Prompt Helper</span>
          </Link>
          
          {isAdminOrSuperadmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 24, paddingBottom: 4 }}>Administrácia</div>
              <Link href="/portal/admin" className="sidebar-item" style={{ 
                color: 'var(--brand)', 
                background: 'linear-gradient(to right, rgba(234,179,8,0.08), transparent)' 
              }}>
                <Crown size={16} strokeWidth={1.8} className="sidebar-icon" />
                <span>Admin Panel</span>
              </Link>
              <Link href="/portal/admin/projects" className="sidebar-item" style={{ 
                color: 'var(--brand)', 
                background: 'linear-gradient(to right, rgba(234,179,8,0.08), transparent)',
                marginTop: 4
              }}>
                <Users size={16} strokeWidth={1.8} className="sidebar-icon" />
                <span>Users & Projects</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <form action={logout}>
            <button type="submit" className="sidebar-item" style={{
              width: '100%', border: 'none', cursor: 'pointer',
              textAlign: 'left', background: 'transparent', fontFamily: 'Inter',
            }}>
              <LogOut size={16} strokeWidth={1.8} />
              <span>Odhlásiť sa</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="portal-main">
        {children}
      </main>
    </div>
  )
}
