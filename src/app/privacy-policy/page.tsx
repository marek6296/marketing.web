import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy – PROJECTBer',
  description: 'Privacy Policy for PROJECTBer application.',
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '60px 24px',
      fontFamily: 'system-ui, sans-serif',
      color: '#1a1a1a',
      lineHeight: '1.7',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Last updated: March 29, 2025</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>1. Introduction</h2>
        <p>
          PROJECTBer ("we", "our", "us") operates the PROJECTBer platform. This Privacy Policy explains how we
          collect, use, and protect your personal data when you use our services, including when you connect
          your social media accounts (such as Facebook/Instagram) to our platform.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>2. Data We Collect</h2>
        <p>When you connect your Facebook or Instagram account, we may collect:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li>Your name and email address</li>
          <li>Pages and accounts you manage</li>
          <li>Access tokens to publish content on your behalf</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          We only request permissions necessary to provide the scheduled posting functionality.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>3. How We Use Your Data</h2>
        <p>Your data is used solely to:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li>Publish posts and content to your connected social media accounts</li>
          <li>Display your connected pages and profile information within the app</li>
          <li>Improve our service and troubleshoot issues</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          We do not sell, rent, or share your personal data with third parties for marketing purposes.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>4. Data Retention</h2>
        <p>
          We retain your data only for as long as your account is active or as needed to provide services.
          You can disconnect your social media accounts at any time from within the app, which will remove
          all associated tokens and data.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>5. User Data Deletion</h2>
        <p>
          You can request deletion of all your data by disconnecting your accounts within the app or by
          contacting us at <a href="mailto:donoval.dony@gmail.com" style={{ color: '#4f46e5' }}>donoval.dony@gmail.com</a>.
          We will process deletion requests within 30 days.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>6. Third-Party Services</h2>
        <p>
          Our platform integrates with the Meta (Facebook/Instagram) API. Your use of connected social
          accounts is also subject to{' '}
          <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
            Meta's Privacy Policy
          </a>.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>7. Security</h2>
        <p>
          We implement industry-standard security measures to protect your data. Access tokens are stored
          securely and encrypted at rest. We do not store your social media passwords.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>8. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:{' '}
          <a href="mailto:donoval.dony@gmail.com" style={{ color: '#4f46e5' }}>donoval.dony@gmail.com</a>
        </p>
      </section>
    </main>
  )
}
