import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, Sparkles } from 'lucide-react'

export default async function ProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('project_id', id)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '44px 1fr 100px 90px 70px',
          gap: 12, padding: '12px 20px', fontSize: 11, fontWeight: 600,
          color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          <span></span><span>Text</span><span>Dátum</span><span>Platforma</span><span>Status</span>
        </div>

        {!posts || posts.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <FileText />
            <p>Žiadne príspevky</p>
            <Link href={`/portal/projects/${id}/generator`} className="btn-ghost" style={{ marginTop: 8, fontSize: 12 }}><Sparkles size={13} /> Vygenerovať</Link>
          </div>
        ) : (
          <div style={{ padding: '4px 8px 8px' }}>
            {posts.map((post) => (
              <div key={post.id} style={{
                display: 'grid', gridTemplateColumns: '44px 1fr 100px 90px 70px',
                gap: 12, padding: '10px 12px', alignItems: 'center', borderRadius: 'var(--radius)',
              }} className="table-row">
                {post.image_url ? (
                  <img src={post.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--text-faint)" /></div>
                )}
                <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{post.caption || '—'}</p>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString('sk-SK')}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{post.platform === 'both' ? 'FB + IG' : post.platform === 'facebook' ? 'Facebook' : 'Instagram'}</span>
                <span className={`badge ${post.status === 'published' ? 'badge-green' : post.status === 'scheduled' ? 'badge-yellow' : post.status === 'failed' ? 'badge-red' : 'badge-brand'}`}>
                  {post.status === 'published' ? 'Live' : post.status === 'scheduled' ? 'Čaká' : post.status === 'failed' ? 'Chyba' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
