import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 68,
      }}>
        {/* Glow blobs */}
        <div className="bg-glow" style={{
          width: 600, height: 600, top: -100, right: -100,
          background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)',
          opacity: 0.12,
        }} />
        <div className="bg-glow" style={{
          width: 400, height: 400, bottom: 0, left: -100,
          background: 'radial-gradient(circle, #FFC107 0%, transparent 70%)',
          opacity: 0.08,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            {/* Badge */}
            <div style={{ marginBottom: 28 }}>
              <span className="badge badge-orange">🤖 AI-powered marketing</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(42px, 6vw, 80px)', fontWeight: 900, marginBottom: 24, lineHeight: 1.05 }}>
              Marketing pre vašu<br />
              <span className="gradient-text">reštauráciu</span> na autopiloct
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7 }}>
              Nechajte AI generovať brandované príspevky pre váš Facebook a Instagram každý deň. My sa postaráme o váš online marketing, kým vy sa venujete vareniu.
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
                Začať zadarmo →
              </Link>
              <a href="#ako-to-funguje" className="btn-secondary" style={{ fontSize: 17, padding: '16px 36px' }}>
                Ako to funguje
              </a>
            </div>

            {/* Social proof */}
            <div style={{ marginTop: 56, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { num: '50+', label: 'Reštaurácií' },
                { num: '2000+', label: 'Príspevkov mesačne' },
                { num: '3×', label: 'Viac interakcií' },
              ].map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {num}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="sluzby" className="section" style={{ background: 'var(--dark-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="badge badge-orange" style={{ marginBottom: 16 }}>Naše služby</span>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, marginBottom: 16 }}>
              Všetko čo vaša reštaurácia potrebuje
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
              Od generovania obsahu až po správu celej vašej online prezentácie.
            </p>
          </div>

          <div className="grid-3">
            {services.map((service, i) => (
              <div key={i} className="glass-card" style={{ padding: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(255, 107, 53, 0.12)',
                  border: '1px solid rgba(255, 107, 53, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 20,
                }}>
                  {service.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{service.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="ako-to-funguje" className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="badge badge-orange" style={{ marginBottom: 16 }}>Proces</span>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800 }}>
              Ako to funguje?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div className="glass-card" style={{ padding: 28, height: '100%' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 18,
                    boxShadow: 'var(--glow-orange-sm)',
                  }}>
                    {i + 1}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="kontakt" className="section" style={{ background: 'var(--dark-surface)' }}>
        <div className="container">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="badge badge-orange" style={{ marginBottom: 16 }}>Kontakt</span>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, marginBottom: 14 }}>
                Začnime spoluprácu
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                Napíšte nám a my sa vám ozveme do 24 hodín.
              </p>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '32px 24px',
        borderTop: '1px solid var(--dark-border)',
        background: 'var(--dark-bg)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17 }}>
            Restaurant<span style={{ color: 'var(--brand-primary)' }}>Boost</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            © 2026 RestaurantBoost. Všetky práva vyhradené.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Prihlásenie</Link>
            <Link href="/register" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Registrácia</Link>
          </div>
        </div>
      </footer>
    </>
  )
}

// ---- DATA ----

const services = [
  {
    icon: '🤖',
    title: 'AI Generovanie obsahu',
    desc: 'Gemini AI generuje brandované príspevky, bannery a texty špeciálne pre vašu reštauráciu každý deň.',
  },
  {
    icon: '📅',
    title: 'Obsahový kalendár',
    desc: 'Plánujte príspevky vopred. Automatické publikovanie na Facebook aj Instagram v optimálnom čase.',
  },
  {
    icon: '🎨',
    title: 'Konzistentná grafika',
    desc: 'Každý príspevok v rovnakom štýle, farbách a brandingu. Váš profil bude vyzerať profesionálne.',
  },
  {
    icon: '📊',
    title: 'Správa sociálnych sietí',
    desc: 'Preberiete správu vašich FB a IG profilov. Odpovede, komentáre, stories – o všetko sa postaráme.',
  },
  {
    icon: '🍽',
    title: 'Špecializácia na reštaurácie',
    desc: 'Rozumieme gastro biznisu. Vieme čo funguje pre reštaurácie, pizzerie, kaviarne aj food trucky.',
  },
  {
    icon: '📈',
    title: 'Rastúci dosah',
    desc: 'Viac príspevkov = viac viditeľnosti = viac zákazníkov. Priemerný rast dosahu o 3× za 3 mesiace.',
  },
]

const steps = [
  {
    title: 'Zaregistrujte sa',
    desc: 'Vytvorte si účet a zadajte základné info o vašej reštaurácii – názov, štýl, farby.',
  },
  {
    title: 'AI sa naučí váš brand',
    desc: 'Na základe vašich informácií nastavíme AI tak, aby generovala obsah presne vo vašom štýle.',
  },
  {
    title: 'Generujte príspevky',
    desc: 'Jedným kliknutím vygenerujte brandovaný obrázok a text pre FB alebo IG.',
  },
  {
    title: 'Schváľte a publikujte',
    desc: 'Prezrite si náhľad, upravte ak treba, a publikujte alebo naplánujte na neskôr.',
  },
]

// ---- CONTACT FORM COMPONENT ----
function ContactForm() {
  return (
    <div className="glass-card" style={{ padding: 40 }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="grid-2">
          <div>
            <label className="input-label" htmlFor="contact-name">Meno</label>
            <input id="contact-name" className="input-field" type="text" placeholder="Ján Novák" required />
          </div>
          <div>
            <label className="input-label" htmlFor="contact-email">Email</label>
            <input id="contact-email" className="input-field" type="email" placeholder="jan@restauracia.sk" required />
          </div>
        </div>
        <div>
          <label className="input-label" htmlFor="contact-restaurant">Názov reštaurácie</label>
          <input id="contact-restaurant" className="input-field" type="text" placeholder="Reštaurácia U Jána" />
        </div>
        <div>
          <label className="input-label" htmlFor="contact-message">Správa</label>
          <textarea
            id="contact-message"
            className="input-field"
            rows={4}
            placeholder="Napíšte nám o vašej reštaurácii a čo potrebujete..."
            style={{ resize: 'vertical' }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ fontSize: 16, padding: '16px' }}>
          Odoslať správu →
        </button>
      </form>
    </div>
  )
}
