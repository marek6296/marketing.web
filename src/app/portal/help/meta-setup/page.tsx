'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2, Copy, ExternalLink, AlertTriangle,
  ChevronDown, ChevronUp, Info, ArrowRight, ShieldAlert,
} from 'lucide-react'

function Step({ number, title, children, done }: { number: number; title: string; children: React.ReactNode; done?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{
      marginBottom: 16, borderRadius: 'var(--radius)',
      border: done ? '1px solid #16a34a33' : '1px solid var(--border)',
      background: 'var(--bg-card)', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: done ? '#16a34a' : 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
        }}>
          {done ? <CheckCircle2 size={15} /> : number}
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px 62px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', margin: '10px 0' }}>
      <pre style={{
        background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        padding: '12px 44px 12px 14px', fontSize: 12, overflowX: 'auto', margin: 0,
        color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>{children}</pre>
      <button onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        style={{
          position: 'absolute', top: 8, right: 8, padding: '4px 8px', borderRadius: 6,
          border: '1px solid var(--border)', background: copied ? '#16a34a' : 'var(--bg-card)',
          cursor: 'pointer', fontSize: 11, color: copied ? 'white' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4, transition: 'all 150ms',
        }}>
        <Copy size={11} />{copied ? 'Skopírované!' : 'Kopírovať'}
      </button>
    </div>
  )
}

function Note({ type = 'info', children }: { type?: 'info' | 'warning'; children: React.ReactNode }) {
  const isWarn = type === 'warning'
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 14px', margin: '10px 0',
      borderRadius: 'var(--radius-sm)', fontSize: 13,
      background: isWarn ? 'rgba(234,179,8,0.08)' : 'rgba(59,130,246,0.08)',
      border: `1px solid ${isWarn ? 'rgba(234,179,8,0.25)' : 'rgba(59,130,246,0.25)'}`,
      color: isWarn ? '#854d0e' : '#1e40af',
    }}>
      {isWarn ? <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> : <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />}
      <span>{children}</span>
    </div>
  )
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: 'var(--brand)', textDecoration: 'none', fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {children} <ExternalLink size={12} />
    </a>
  )
}

function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div style={{ margin: '14px 0', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-sm)' }}
      />
      {caption && (
        <div style={{
          padding: '8px 12px', background: 'var(--bg-base)',
          fontSize: 11, color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
        }}>
          📸 {caption}
        </div>
      )}
    </div>
  )
}

export default function MetaSetupGuide() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: 'var(--brand-bg)', color: 'var(--brand-dark)', border: '1px solid var(--brand-border)',
          }}>SPRIEVODCA</div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          Nastavenie Facebook & Instagram API
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Podrobný návod ako získať permanentný prístupový token pre automatické publikovanie príspevkov na Facebook a Instagram.
          Celý postup trvá približne <strong>15 minút</strong>.
        </p>
      </div>

      {/* Prerequisite */}
      <div style={{
        padding: '14px 18px', marginBottom: 24, borderRadius: 'var(--radius)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text-primary)' }}>
          ✅ Čo potrebuješ pred začatím
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
          <li><strong>Business Instagram účet</strong> – prepojený s Facebook Stránkou</li>
          <li><strong>Facebook Stránka</strong> (Page) – kde chceš publikovať</li>
          <li><strong>Administrátorský prístup</strong> k tejto Facebook Stránke</li>
        </ul>
        <Note type="info">Nemáš Business Instagram? Choď v Instagrame na Nastavenia → Účet → Prepnúť na profesionálny účet.</Note>
      </div>

      {/* Steps */}
      <Step number={1} title="Vytvor Meta Developer účet">
        <p>Otvor <ExtLink href="https://developers.facebook.com">developers.facebook.com</ExtLink> a prihlás sa svojím Facebook účtom.</p>
        <p>Klikni na <strong>„Get Started"</strong> ak ešte nemáš developer účet. Na otázku <em>„Which of the following best describes you?"</em> vyber <strong>Developer</strong> alebo <strong>Owner/founder</strong>.</p>
        <p>Prechádza 4 kroky: <strong>Register → Verify account → Contact info → About you</strong> → klikni <strong>Complete Registration</strong>.</p>
      </Step>

      <Step number={2} title="Vytvor novú Meta App">
        <p>Po registrácii ťa presmeruje na dashboard. Klikni <strong>„Create App"</strong>.</p>
        <p><strong>Use cases</strong> – klikni vľavo na <strong>„Content management (5)"</strong> a zaškrtni:</p>
        <ul style={{ lineHeight: 2 }}>
          <li>✅ <strong>Manage messaging &amp; content on Instagram</strong></li>
          <li>✅ <strong>Manage everything on your Page</strong></li>
        </ul>
        <p>Klikni <strong>Next → </strong>vyber Business účet → <strong>Next</strong> → na stránke „Requirements" klikni <strong>Next</strong> → <strong>Create app</strong>.</p>
        <p>Po vytvorení ťa presmeruje na App Dashboard – tu nájdeš <strong>App ID</strong> a <strong>App Secret</strong> (App Settings → Basic).</p>
        <Screenshot
          src="/meta-guide/step2-app-settings.png"
          alt="Meta App Settings Basic"
          caption="App Settings → Basic – tu nájdeš App ID a App Secret (klikni Show)"
        />
      </Step>

      <Step number={3} title="Pridaj permissions pre Instagram API">
        <p>V ľavom menu appky klikni <strong>Use cases</strong>. Pri <strong>Instagram API</strong> klikni <strong>Customize</strong>. Potom klikni na <strong>„API setup with Facebook login"</strong> v ľavom menu.</p>
        <Note type="info">Nepoužívaj „API setup with Instagram login" – to je pre osobné účty. Ty potrebuješ „<strong>API setup with Facebook login</strong>" pre Business Instagram napojený na FB Stránku.</Note>
        <Screenshot
          src="/meta-guide/step3-instagram-setup.png"
          alt="Instagram API setup with Facebook login"
          caption="Na stránke klikni 'Add required content permissions' – pridá všetky potrebné permissions naraz"
        />
        <p>Klikni na <strong>„Add required content permissions"</strong> – pridá:</p>
        <ul style={{ lineHeight: 2 }}>
          <li>instagram_basic, instagram_content_publishing, pages_read_engagement, business_management, pages_show_list</li>
        </ul>
        <p>Potom choď na <strong>Permissions and features</strong> (vľavo) a skontroluj že <strong>pages_manage_posts</strong> má status <strong>„Ready for testing"</strong>.</p>
      </Step>

      <Step number={4} title="Vygeneruj Access Token v Graph API Explorer">
        <p>Otvor <ExtLink href="https://developers.facebook.com/tools/explorer">Graph API Explorer</ExtLink>.</p>
        <Screenshot
          src="/meta-guide/step4-graph-explorer.png"
          alt="Graph API Explorer"
          caption="Graph API Explorer – vyber svoju appku a pridaj permissions pred generovaním tokenu"
        />
        <p><strong>Nastavenia:</strong></p>
        <ul style={{ lineHeight: 2 }}>
          <li><strong>Meta App:</strong> vyber svoju appku</li>
          <li><strong>User or Page:</strong> nechaj na „Get Token"</li>
        </ul>
        <p>V sekcii <strong>Permissions</strong> pridaj cez „Add a Permission":</p>
        <ul style={{ lineHeight: 2 }}>
          <li>instagram_basic &nbsp;·&nbsp; instagram_content_publish &nbsp;·&nbsp; instagram_manage_messages</li>
          <li>business_management &nbsp;·&nbsp; pages_show_list &nbsp;·&nbsp; pages_read_engagement &nbsp;·&nbsp; pages_manage_posts</li>
        </ul>
        <Note type="info">
          Tieto permissions sú potrebné pre <strong>publikovanie</strong> príspevkov. Pre mazanie príspevkov priamo z portálu sú tieto isté permissions dostatočné pre Facebook – Instagram má však obmedzenie API (pozri poznámku nižšie).
        </Note>
        <p>Klikni <strong>„Generate Access Token"</strong> → potvrď v dialógu → skopíruj vygenerovaný token (platí ~1 hodinu).</p>
      </Step>

      <Step number={5} title="Vymeň za dlhodobý token (60 dní)">
        <p>Otvor nový tab v prehliadači a vlep nasledujúcu URL. Nahraď hodnoty svojimi údajmi:</p>
        <Code>{`https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=TVOJE_APP_ID&client_secret=TVOJ_APP_SECRET&fb_exchange_token=KRATKODIBY_TOKEN`}</Code>
        <Note type="warning">App ID a App Secret nájdeš v App Settings → Basic. App Secret nikdy nikomu neukazuj ani nezverejňuj – zober ho z políčka po kliknutí na „Show"!</Note>
        <p>V prehliadači uvidíš JSON odpoveď:</p>
        <Code>{`{"access_token":"EAAQde...dlhy_token...","token_type":"bearer","expires_in":5183750}`}</Code>
        <p>Skopíruj hodnotu <strong>access_token</strong> – to je tvoj <strong>60-dňový User Token</strong>.</p>
      </Step>

      <Step number={6} title="Získaj permanentný Page Access Token">
        <p>Otvor nový tab a vlep (nahraď <code>DLHODOBY_TOKEN</code> tvojím 60-dňovým tokenom):</p>
        <Code>{`https://graph.facebook.com/me/accounts?access_token=DLHODOBY_TOKEN`}</Code>
        <p>Uvidíš JSON so zoznamom tvojich Facebook stránok. Skopíruj <strong>access_token</strong> aj <strong>id</strong> z výsledku:</p>
        <Code>{`{
  "data": [{
    "access_token": "EAAQde...PERMANENTNY_TOKEN...",
    "name": "Názov tvojej stránky",
    "id": "904915619382532"
  }]
}`}</Code>
        <Note type="info">Tento Page Access Token <strong>nikdy nevyprší</strong> – je to token ktorý pridáš do nastavení projektu.</Note>
      </Step>

      <Step number={7} title="Získaj Instagram Business Account ID">
        <p>Otvor nový tab a vlep (nahraď hodnoty svojimi):</p>
        <Code>{`https://graph.facebook.com/FACEBOOK_PAGE_ID?fields=instagram_business_account&access_token=PERMANENTNY_PAGE_TOKEN`}</Code>
        <p>Odpoveď bude vyzerať takto:</p>
        <Code>{`{
  "instagram_business_account": {
    "id": "17841439610722804"
  },
  "id": "904915619382532"
}`}</Code>
        <p>Skopíruj <strong>instagram_business_account.id</strong> – to je tvoj Instagram Account ID.</p>
      </Step>

      <Step number={8} title="Ulož všetko do Nastavení projektu">
        <p>Teraz máš všetky 3 hodnoty:</p>
        <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
          {[
            { label: 'Facebook Page ID', example: 'napr. 904915619382532' },
            { label: 'Instagram Account ID', example: 'napr. 17841439610722804' },
            { label: 'Meta Access Token', example: 'EAAQde... (dlhý permanentný Page token)' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)',
            }}>
              <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.example}</div>
              </div>
            </div>
          ))}
        </div>
        <p>Choď do <strong>Nastavenia projektu → sekcia Social Media</strong> a zadaj tieto hodnoty. Ulož a publikovanie je aktívne!</p>
        <Note type="warning">Po zadaní tokenu ho uchovaj bezpečne. Ak sa token kompromituje, obnov App Secret v Meta Developer konzole a celý postup zopakuj.</Note>
      </Step>

      {/* CTA */}
      <div style={{
        padding: 20, borderRadius: 'var(--radius)',
        background: 'linear-gradient(135deg, var(--brand-bg), transparent)',
        border: '1px solid var(--brand-border)', textAlign: 'center',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>
          🎉 Hotovo! Môžeš začať publikovať
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Zadaj získané tokeny v nastaveniach svojho projektu a tlačidlo „Publikovať" bude fungovať naplno.
        </p>
        <Link href="/portal/projects" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', borderRadius: 'var(--radius)', textDecoration: 'none',
          background: 'var(--brand)', color: 'white', fontWeight: 600, fontSize: 13,
        }}>
          Prejsť na projekty <ArrowRight size={14} />
        </Link>
      </div>

      {/* Instagram delete limitation note */}
      <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.06)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <AlertTriangle size={15} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
            <strong>Obmedzenie pri mazaňí Instagram príspevkov:</strong><br />
            Keď vymazávaš príspevok z portálu, máš dve možnosti – vymazať len z portálu, alebo aj zo sociálnych sietí.
            Facebook mazá funguje bezproblémove. <strong>Instagram API však má obmedzenú podporu pre mazánie</strong> – ak mazánie zo siete nepríde, vymaž príspevok manuálne priamo cez Instagram aplikáciu alebo 
            <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309' }}>Meta Business Suite</a>.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.05)', display: 'flex', gap: 10 }}>
        <ShieldAlert size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12, color: '#dc2626', margin: 0, lineHeight: 1.6 }}>
          <strong>Bezpečnosť:</strong> Nikdy nezverejňuj App Secret ani Access Token verejne (GitHub, chat, email). Page Access Token je ako heslo k tvojej stránke.
        </p>
      </div>
    </div>
  )
}
