'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, Sparkles, CalendarDays, Clock, Settings, Library, FileText,
} from 'lucide-react'

type NavItem = { href: string; icon: React.ComponentType<{ size: number; color?: string }>; label: string }

export function ProjectNav({ id }: { id: string }) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: `/portal/projects/${id}`,           icon: LayoutGrid,  label: 'Dashboard' },
    { href: `/portal/projects/${id}/generator`, icon: Sparkles,    label: 'Generátor' },
    { href: `/portal/projects/${id}/images`,    icon: Library,     label: 'Obrázky' },
    { href: `/portal/projects/${id}/posts`,     icon: FileText,    label: 'Príspevky' },
    { href: `/portal/projects/${id}/calendar`,  icon: CalendarDays,label: 'Kalendár' },
    { href: `/portal/projects/${id}/history`,   icon: Clock,       label: 'História' },
    { href: `/portal/projects/${id}/settings`,  icon: Settings,    label: 'Nastavenia' },
  ]

  return (
    <div style={{
      display: 'flex', gap: 2, marginBottom: 24,
      background: 'var(--bg-card)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: 4,
      overflowX: 'auto',
    }}>
      {navItems.map((item) => {
        // Exact match for dashboard, prefix match for sub-pages
        const active = item.href === `/portal/projects/${id}`
          ? pathname === item.href
          : pathname.startsWith(item.href)

        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, whiteSpace: 'nowrap', textDecoration: 'none',
              transition: 'all 150ms', flexShrink: 0,
              // Active state
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--brand-dark)' : 'var(--text-secondary)',
              background: active ? 'var(--brand-bg)' : 'transparent',
              border: active ? '1px solid var(--brand-border)' : '1px solid transparent',
            }}
          >
            <Icon size={14} color={active ? 'var(--brand)' : undefined} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
