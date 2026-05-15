import { Layout, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Content, Header } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 24,
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: 16, color: '#0B5ED7' }}>
          Grant Thornton CRM
        </Link>
        <Space>
          <Link to="/terms">{t('privacy.termsLink', 'Terms of Service')}</Link>
          <Link to="/status">{t('privacy.statusLink', 'Status')}</Link>
        </Space>
      </Header>

      <Content style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <Title level={2}>{t('privacy.title', 'Privacy Policy')}</Title>
        <Text type="secondary">{t('privacy.lastUpdated', 'Last updated: May 15, 2026')}</Text>

        <div style={{ marginTop: 32 }}>
          <Title level={4}>{t('privacy.s1Title', '1. Introduction')}</Title>
          <Paragraph>
            {t(
              'privacy.s1Text',
              'Grant Thornton CRM ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data. By using the Service, you agree to the practices described in this policy.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s2Title', '2. Data We Collect')}</Title>
          <Paragraph>
            {t(
              'privacy.s2Text',
              'We collect the following categories of data: (a) Account information — company name, administrator email address, and hashed passwords; (b) Employee data — full names, email addresses, phone numbers, job positions, and work assignments entered by your organization; (c) Usage data — login timestamps, pages visited, and feature interactions for analytics and security; (d) Payment data — billing details processed securely by Stripe; we do not store full card numbers.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s3Title', '3. How We Use Your Data')}</Title>
          <Paragraph>
            {t(
              'privacy.s3Text',
              'We use collected data to: provide and maintain the Service; process subscription payments; send transactional emails (password delivery, assignment notifications, welcome emails); improve the Service through aggregated, anonymized analytics; and ensure security and prevent fraud.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s4Title', '4. Data Storage and Security')}</Title>
          <Paragraph>
            {t(
              'privacy.s4Text',
              'Your data is stored on servers located in the EU/US region. We use industry-standard encryption (TLS in transit, AES-256 at rest) and access controls to protect your data. Employee passwords are stored as bcrypt hashes and are never stored in plain text for administrators.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s5Title', '5. Data Sharing')}</Title>
          <Paragraph>
            {t(
              'privacy.s5Text',
              'We do not sell your data to third parties. We share data only with: (a) Stripe — for payment processing; (b) email delivery providers — for transactional notifications; (c) infrastructure providers (hosting, CDN) — bound by data processing agreements. All sub-processors are contractually obligated to protect your data.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s6Title', '6. GDPR and Your Rights')}</Title>
          <Paragraph>
            {t(
              'privacy.s6Text',
              'If you are located in the European Economic Area, you have the following rights under GDPR: the right to access your personal data; the right to rectify inaccurate data; the right to erasure ("right to be forgotten"); the right to restrict processing; the right to data portability; the right to object to processing. To exercise these rights, contact us at privacy@grant-thornton.online.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s7Title', '7. Data Retention')}</Title>
          <Paragraph>
            {t(
              'privacy.s7Text',
              'We retain your data for the duration of your active subscription plus 30 days after termination, after which all organization data is permanently deleted. Anonymized usage statistics may be retained for up to 2 years for analytics purposes.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s8Title', '8. Cookies')}</Title>
          <Paragraph>
            {t(
              'privacy.s8Text',
              'We use only essential cookies required for authentication (JWT stored in localStorage). We do not use advertising or tracking cookies. The application does not use third-party analytics scripts that track individual users across websites.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s9Title', '9. Children\'s Privacy')}</Title>
          <Paragraph>
            {t(
              'privacy.s9Text',
              'The Service is not intended for use by individuals under 16 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal information, please contact us and we will delete it promptly.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s10Title', '10. Changes to This Policy')}</Title>
          <Paragraph>
            {t(
              'privacy.s10Text',
              'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. The updated policy will be effective from the date indicated at the top of this page.',
            )}
          </Paragraph>

          <Title level={4}>{t('privacy.s11Title', '11. Contact')}</Title>
          <Paragraph>
            {t(
              'privacy.s11Text',
              'For privacy-related inquiries, data subject requests, or to report a data breach, contact our Data Protection Officer at privacy@grant-thornton.online.',
            )}
          </Paragraph>
        </div>
      </Content>
    </Layout>
  );
}
