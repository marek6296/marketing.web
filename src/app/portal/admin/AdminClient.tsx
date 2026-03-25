'use client'

import { useState, useEffect, useRef } from 'react'
import { updateUserRole } from '@/app/actions/admin'
import { Crown, ShieldCheck, User, Loader2, Mail, Calendar, ChevronDown } from 'lucide-react'

type Profile = {
  id: string
  email: string
  role: string
  plan: string
  created_at: string
}

export default function AdminClient({ profiles, isSuperAdmin, currentUserEmail }: { profiles: Profile[], isSuperAdmin: boolean, currentUserEmail: string | undefined }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: string) {
    if (!isSuperAdmin) return
    setUpdating(userId)
    await updateUserRole(userId, newRole)
    setUpdating(null)
  }

  async function handlePlanChange(userId: string, newPlan: string) {
    if (!isSuperAdmin) return
    setUpdating(userId)
    // Importing from a dynamic module without breaking the current UI
    import('@/app/actions/admin').then(m => m.updateUserPlan(userId, newPlan)).then(() => setUpdating(null))
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'visible' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)', borderTopLeftRadius: 'calc(var(--radius) - 1px)', borderTopRightRadius: 'calc(var(--radius) - 1px)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Registrovaní používatelia</h2>
      </div>
      
      <div style={{ overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Používateľ</th>
              <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rola</th>
              <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Plán</th>
              <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dátum registrácie</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(profile => {
              const roleConfig = 
                profile.role === 'superadmin' ? { icon: Crown, color: '#EAB308', bg: '#FEF08A', label: 'Superadmin' } :
                profile.role === 'admin' ? { icon: ShieldCheck, color: 'var(--brand)', bg: 'var(--brand-bg)', label: 'Admin' } :
                { icon: User, color: 'var(--text-secondary)', bg: 'var(--bg-hover)', label: 'User' }
                
              const Icon = roleConfig.icon
              const isMe = profile.email === currentUserEmail
              
              return (
                <tr key={profile.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={14} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {profile.email}
                          {isMe && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--brand)', color: 'white', borderRadius: 20, fontWeight: 700 }}>TY</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>ID: {profile.id.split('-')[0]}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {isSuperAdmin && profile.role !== 'superadmin' ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === profile.id ? null : profile.id)}
                          style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 10px', 
                            borderRadius: 20, background: roleConfig.bg, color: roleConfig.color, 
                            fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                            opacity: updating === profile.id ? 0.6 : 1, transition: 'all 150ms'
                          }}
                          disabled={updating === profile.id}
                        >
                          {updating === profile.id ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Icon size={14} />} 
                          {roleConfig.label}
                          <ChevronDown size={14} style={{ opacity: 0.6 }} />
                        </button>
                        
                        {openDropdownId === profile.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenDropdownId(null)} />
                            <div style={{ 
                              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                              background: 'var(--bg-card)', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                              minWidth: 140, padding: 4, display: 'flex', flexDirection: 'column'
                            }}>
                              <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zmeniť rolu</div>
                              {['user', 'admin'].map(r => (
                                <button
                                  key={r}
                                  onClick={() => {
                                    setOpenDropdownId(null)
                                    if (r !== profile.role) handleRoleChange(profile.id, r)
                                  }}
                                  style={{ 
                                    padding: '8px 10px', textAlign: 'left', background: 'transparent',
                                    border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8
                                  }}
                                  className="dropdown-item"
                                >
                                  {r === 'admin' ? <ShieldCheck size={14} color="var(--brand)" /> : <User size={14} color="var(--text-secondary)" />}
                                  <span style={{ fontWeight: r === profile.role ? 600 : 400 }}>{r === 'admin' ? 'Admin' : 'User'}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: roleConfig.bg, color: roleConfig.color, fontSize: 12, fontWeight: 600 }}>
                        <Icon size={14} /> {roleConfig.label}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {isSuperAdmin && profile.role !== 'admin' && profile.role !== 'superadmin' ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === profile.id + '_plan' ? null : profile.id + '_plan')}
                          style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 10px', 
                            borderRadius: 20, background: 'var(--bg-hover)', color: 'var(--text-primary)', 
                            fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer',
                            opacity: updating === profile.id ? 0.6 : 1, transition: 'all 150ms'
                          }}
                          disabled={updating === profile.id}
                        >
                          {updating === profile.id ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : null} 
                          {profile.plan?.toUpperCase() || 'FREE'}
                          <ChevronDown size={14} style={{ opacity: 0.6 }} />
                        </button>
                        
                        {openDropdownId === profile.id + '_plan' && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenDropdownId(null)} />
                            <div style={{ 
                              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                              background: 'var(--bg-card)', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                              minWidth: 140, padding: 4, display: 'flex', flexDirection: 'column'
                            }}>
                              <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zmeniť plán</div>
                              {['free', 'pro', 'enterprise'].map(p => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    setOpenDropdownId(null)
                                    if (p !== profile.plan) handlePlanChange(profile.id, p)
                                  }}
                                  style={{ 
                                    padding: '8px 10px', textAlign: 'left', background: 'transparent',
                                    border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8
                                  }}
                                  className="dropdown-item"
                                >
                                  <span style={{ fontWeight: p === profile.plan ? 600 : 400 }}>{p.toUpperCase()}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, 
                        background: (profile.role === 'superadmin' || profile.role === 'admin') ? 'var(--brand-bg)' : 'var(--bg-hover)', 
                        color: (profile.role === 'superadmin' || profile.role === 'admin') ? 'var(--brand)' : 'var(--text-secondary)', 
                        fontSize: 12, fontWeight: 600, border: '1px solid var(--border)' 
                      }}>
                        {(profile.role === 'superadmin' || profile.role === 'admin') ? 'UNLIMITED' : (profile.plan?.toUpperCase() || 'FREE')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} color="var(--text-faint)" />
                      {new Date(profile.created_at).toLocaleDateString('sk-SK')}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {profiles.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenašli sa žiadni používatelia.
          </div>
        )}
      </div>
    </div>
  )
}
