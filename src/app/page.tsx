import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 64,
        background: 'var(--bg-body)',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', width: 700, height: 700, top: -200, right: -200,
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, bottom: -100, left: -100,
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>


            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(48px, 6.5vw, 82px)', fontWeight: 900,
              marginBottom: 20, lineHeight: 1.08, letterSpacing: '-0.03em',
              fontFamily: "'Montserrat', sans-serif",
            }}>
              Sociálne siete{' '}
              <span className="gradient-text">na autopilote</span>
            </h1>

            <p style={{
              fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40,
              maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7,
            }}>
              PROJECTBer generuje brandované príspevky, obrázky a texty pre vaše sociálne siete. Vy sa venujete biznisu, AI sa postará o marketing.
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary" style={{
                fontSize: 15, padding: '14px 32px', borderRadius: 12,
              }}>
                Začať zadarmo <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-secondary" style={{
                fontSize: 15, padding: '14px 32px', borderRadius: 12,
              }}>
                Ako to funguje
              </a>
            </div>

            {/* Stats */}
            <div style={{
              marginTop: 64, display: 'flex', gap: 1, justifyContent: 'center',
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)', overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              maxWidth: 520, margin: '64px auto 0',
            }}>
              {[
                { num: '10k+', label: 'Príspevkov' },
                { num: '500+', label: 'Projektov' },
                { num: '99%', label: 'Spokojnosť' },
              ].map(({ num, label }, i) => (
                <div key={label} style={{
                  flex: 1, padding: '20px 16px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{num}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--brand)', marginBottom: 12, display: 'block',
            }}>
              FUNKCIE
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Všetko čo potrebujete
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
              Od generovania obsahu po publikovanie — kompletný nástroj na správu sociálnych sietí.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{
                padding: '28px 28px 24px',
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid var(--border)',
                borderTop: `3px solid ${f.accent}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `linear-gradient(135deg, ${f.accent}18 0%, ${f.accent}08 100%)`,
                    border: `1px solid ${f.accent}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      {f.svg}
                    </svg>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.accent, letterSpacing: '0.06em', fontFamily: 'Montserrat' }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 0', background: 'var(--bg-body)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--brand)', marginBottom: 12, display: 'block',
            }}>
              PROCES
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              4 kroky k autopilotu
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} className="card" style={{ padding: 28, position: 'relative' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--brand)', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, marginBottom: 16,
                  boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--brand)', marginBottom: 12, display: 'block',
            }}>
              CENNÍK
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Vyberte si plán
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
              Začnite zadarmo. Škálujte keď rastie váš biznis.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
            {plans.map((plan, i) => (
              <div key={i} className="card" style={{
                padding: 32, position: 'relative', overflow: 'hidden',
                border: plan.popular ? '2px solid var(--brand)' : '1px solid var(--border)',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: 14, right: -28, transform: 'rotate(45deg)',
                    background: 'var(--brand)', color: '#FFF', fontSize: 10, fontWeight: 700,
                    padding: '4px 36px', letterSpacing: '0.04em',
                  }}>
                    POPULÁRNY
                  </div>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{plan.desc}</p>
                <Link href="/register" className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{
                  width: '100%', padding: '12px', fontSize: 14, borderRadius: 10,
                  display: 'flex', justifyContent: 'center',
                }}>
                  {plan.cta}
                </Link>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Check size={14} color="var(--success)" strokeWidth={3} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-sidebar)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#FFF', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Pripravení automatizovať marketing?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Vytvorte si účet zadarmo a začnite generovať obsah ešte dnes.
          </p>
          <Link href="/register" className="btn-primary" style={{
            fontSize: 16, padding: '16px 40px', borderRadius: 12,
          }}>
            Začať zadarmo <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '28px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            PROJECTBer
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            © 2026 PROJECTBer. Všetky práva vyhradené.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>Prihlásenie</Link>
            <Link href="/register" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>Registrácia</Link>
          </div>
        </div>
      </footer>
    </>
  )
}

// ── DATA ──────────────────────────────────────────────────────────────

const features = [
  {
    title: 'AI Generovanie obsahu',
    desc: 'Gemini AI vytvorí brandované texty a obrázky presne vo vašom štýle. Stačí jedno kliknutie.',
    accent: '#F59E0B',
    svg: <><path d="M10 2L12.4 7.5H18L13.6 11L15.5 17L10 13.5L4.5 17L6.4 11L2 7.5H7.6L10 2Z" fill="#F59E0B" fillOpacity="0.8" /></>,
  },
  {
    title: 'Plánovanie príspevkov',
    desc: 'Naplánujte obsah na týždne dopredu. Automatické publikovanie presne kedy chcete.',
    accent: '#0EA5E9',
    svg: <><rect x="3" y="4" width="14" height="13" rx="2" stroke="#0EA5E9" strokeWidth="1.5" fill="none"/><path d="M3 8h14" stroke="#0EA5E9" strokeWidth="1.5"/><path d="M7 2v3M13 2v3" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round"/><rect x="6" y="11" width="3" height="2" rx="0.5" fill="#0EA5E9" fillOpacity="0.7"/><rect x="11" y="11" width="3" height="2" rx="0.5" fill="#0EA5E9" fillOpacity="0.4"/></>,
  },
  {
    title: 'Multi-platform',
    desc: 'Facebook, Instagram — publikujte na všetky platformy naraz z jedného miesta.',
    accent: '#8B5CF6',
    svg: <><circle cx="10" cy="4" r="2" fill="#8B5CF6"/><circle cx="16" cy="10" r="2" fill="#8B5CF6" fillOpacity="0.7"/><circle cx="4" cy="10" r="2" fill="#8B5CF6" fillOpacity="0.7"/><circle cx="10" cy="16" r="2" fill="#8B5CF6" fillOpacity="0.5"/><path d="M10 6l6 2.5M10 6L4 8.5M16 12l-6 2M4 12l6 2" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.5"/></>,
  },
  {
    title: 'Brand konzistencia',
    desc: 'Nastavte farby, štýl a tón. Každý príspevok bude vyzerať ako od profesionálneho dizajnéra.',
    accent: '#10B981',
    svg: <><circle cx="6" cy="6" r="3" fill="#10B981" fillOpacity="0.8"/><circle cx="14" cy="6" r="3" fill="#10B981" fillOpacity="0.5"/><circle cx="10" cy="14" r="3" fill="#10B981" fillOpacity="0.6"/><path d="M8.5 8.5l3 3M11.5 8.5l-3 3" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.4"/></>,
  },
  {
    title: 'AI Editor obrázkov',
    desc: 'Upravujte, generujte a retušujte obrázky priamo v editore. Pridajte texty, filtre a efekty.',
    accent: '#F43F5E',
    svg: <><rect x="2" y="2" width="16" height="13" rx="2" stroke="#F43F5E" strokeWidth="1.5" fill="none"/><path d="M2 11l4-4 3 3 3-4 6 5" stroke="#F43F5E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7"/><path d="M14 16l2 2M16 16l2 2" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round"/></>,
  },
  {
    title: 'Knižnica médií',
    desc: 'Všetky vaše obrázky a grafiky na jednom mieste. Organizované, prehľadné, vždy po ruke.',
    accent: '#6366F1',
    svg: <><rect x="2" y="5" width="7" height="10" rx="1.5" stroke="#6366F1" strokeWidth="1.5" fill="none"/><rect x="11" y="2" width="7" height="6" rx="1.5" stroke="#6366F1" strokeWidth="1.5" fill="none" fillOpacity="0.6"/><rect x="11" y="10" width="7" height="5" rx="1.5" stroke="#6366F1" strokeWidth="1.5" fill="none" fillOpacity="0.4"/></>,
  },
]

const steps = [
  {
    title: 'Vytvorte si účet',
    desc: 'Registrujte sa zadarmo a pridajte svoj prvý projekt za menej ako minútu.',
  },
  {
    title: 'Nastavte brand',
    desc: 'Zadajte farby, štýl a popis vášho brandu. AI sa naučí generovať vo vašom štýle.',
  },
  {
    title: 'Generujte obsah',
    desc: 'Jedným kliknutím vygenerujte príspevok s brandovaným obrázkom a textom.',
  },
  {
    title: 'Publikujte',
    desc: 'Schváľte, upravte ak treba, a publikujte alebo naplánujte na neskôr.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '0€',
    period: '/mesiac',
    desc: 'Pre začiatočníkov. Manuálna tvorba obsahu bez AI.',
    cta: 'Začať zadarmo',
    popular: false,
    features: [
      'Neobmedzené projekty',
      'Manuálna tvorba príspevkov',
      'Knižnica médií',
      'Publikovanie na siete',
    ],
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mesiac',
    desc: 'Pre rastúce firmy. AI generovanie a plná automatizácia.',
    cta: 'Vybrať Pro',
    popular: true,
    features: [
      'Všetko z Free',
      '300 AI tokenov/mesiac',
      'AI generovanie textov',
      'AI generovanie obrázkov',
      'AI editor obrázkov',
      'Prioritná podpora',
    ],
  },
  {
    name: 'Enterprise',
    price: '99€',
    period: '/mesiac',
    desc: 'Pre agentúry a veľké firmy s vysokým objemom obsahu.',
    cta: 'Kontaktovať nás',
    popular: false,
    features: [
      'Všetko z Pro',
      '2 000 AI tokenov/mesiac',
      'Neobmedzené projekty',
      'Tímové účty',
      'Dedikovaná podpora',
      'Custom brand nastavenia',
    ],
  },
]
