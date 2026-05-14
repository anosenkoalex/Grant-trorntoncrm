import { Button, Card, Layout, Result, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Text } = Typography;

export default function RegisterSuccessPage() {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Card style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <Result
              status="success"
              title="Registration complete!"
              subTitle={
                <div>
                  <Text>
                    Your company account has been created and your subscription is active.
                    You can now log in with the email and password you provided.
                  </Text>
                </div>
              }
              extra={[
                <Button
                  type="primary"
                  size="large"
                  key="login"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>,
              ]}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
