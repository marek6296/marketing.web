import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import {
  LayoutGrid,
  FolderKanban,
  LogOut,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="portal-layout">
      <aside className="sidebar">
        {/* Brand logo */}
        <div style={{ padding: '22px 20px 18px' }}>
          <Link href="/portal/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
            }}>
              <Sparkles size={16} color="#FFF" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#FFF', letterSpacing: '-0.02em' }}>
              RestaurantBoost
            </span>
          </Link>
        </div>

        {/* User card */}
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 1 }}>Účet</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {user.email}
              </div>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
          </div>
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
