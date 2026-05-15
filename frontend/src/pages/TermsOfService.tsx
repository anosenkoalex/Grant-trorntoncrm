import { Layout, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Content, Header } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function TermsOfService() {
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
          <Link to="/privacy">{t('terms.privacyLink', 'Privacy Policy')}</Link>
          <Link to="/status">{t('terms.statusLink', 'Status')}</Link>
        </Space>
      </Header>

      <Content style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <Title level={2}>{t('terms.title', 'Terms of Service')}</Title>
        <Text type="secondary">{t('terms.lastUpdated', 'Last updated: May 15, 2026')}</Text>

        <div style={{ marginTop: 32 }}>
          <Title level={4}>{t('terms.s1Title', '1. Acceptance of Terms')}</Title>
          <Paragraph>
            {t(
              'terms.s1Text',
              'By accessing or using Grant Thornton CRM ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users, including administrators, managers, and employees.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s2Title', '2. Description of Service')}</Title>
          <Paragraph>
            {t(
              'terms.s2Text',
              'Grant Thornton CRM is a workforce management platform that provides tools for scheduling employees, managing assignments, tracking work reports, and related HR functions. The Service is offered on a subscription basis (SaaS) and is accessible via web browser.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s3Title', '3. Subscription Plans and Billing')}</Title>
          <Paragraph>
            {t(
              'terms.s3Text',
              'The Service is available under the following plans: Starter ($29/month, up to 25 users), Business ($99/month, up to 100 users), and Enterprise ($299/month, unlimited users). Subscriptions are billed monthly and renew automatically. You may cancel at any time; access continues until the end of the current billing period. No refunds are provided for partial months.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s4Title', '4. Free Trial')}</Title>
          <Paragraph>
            {t(
              'terms.s4Text',
              'New organizations may be eligible for a 14-day free trial. No credit card is required to start a trial. At the end of the trial period, you must subscribe to a paid plan to continue using the Service. Trial accounts that are not converted are automatically deactivated.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s5Title', '5. User Accounts and Responsibilities')}</Title>
          <Paragraph>
            {t(
              'terms.s5Text',
              'You are responsible for maintaining the confidentiality of your account credentials. You agree not to share passwords or allow unauthorized access to the Service. You must notify us immediately of any suspected unauthorized use. Each organization account may have one Super Administrator and multiple Managers and Employees as defined by the chosen plan.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s6Title', '6. Acceptable Use')}</Title>
          <Paragraph>
            {t(
              'terms.s6Text',
              'You agree to use the Service only for lawful purposes. You may not use the Service to store or transmit malicious code, harass or harm others, violate any applicable laws or regulations, or attempt to gain unauthorized access to any part of the Service or its infrastructure.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s7Title', '7. Data Ownership')}</Title>
          <Paragraph>
            {t(
              'terms.s7Text',
              'You retain ownership of all data you input into the Service. We do not sell your data to third parties. Upon termination of your subscription, your data will be retained for 30 days, after which it will be permanently deleted. You may export your data at any time during an active subscription.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s8Title', '8. Service Availability')}</Title>
          <Paragraph>
            {t(
              'terms.s8Text',
              'We strive to maintain 99.9% uptime. Scheduled maintenance windows will be communicated in advance. We are not liable for downtime caused by factors outside our control, including internet service outages, third-party service failures, or force majeure events.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s9Title', '9. Limitation of Liability')}</Title>
          <Paragraph>
            {t(
              'terms.s9Text',
              'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service. Our total liability shall not exceed the amount paid by you in the three months preceding the claim.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s10Title', '10. Termination')}</Title>
          <Paragraph>
            {t(
              'terms.s10Text',
              'Either party may terminate the subscription at any time. We reserve the right to suspend or terminate accounts that violate these Terms of Service without prior notice. Upon termination, your right to use the Service immediately ceases.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s11Title', '11. Changes to Terms')}</Title>
          <Paragraph>
            {t(
              'terms.s11Text',
              'We may modify these Terms of Service at any time. We will notify you of material changes via email or in-app notification at least 14 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the new terms.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s12Title', '12. Governing Law')}</Title>
          <Paragraph>
            {t(
              'terms.s12Text',
              'These Terms of Service are governed by applicable law. Any disputes shall be resolved through binding arbitration, except where prohibited by law. If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force.',
            )}
          </Paragraph>

          <Title level={4}>{t('terms.s13Title', '13. Contact')}</Title>
          <Paragraph>
            {t(
              'terms.s13Text',
              'For questions about these Terms of Service, please contact us at support@grant-thornton.online.',
            )}
          </Paragraph>
        </div>
      </Content>
    </Layout>
  );
}
