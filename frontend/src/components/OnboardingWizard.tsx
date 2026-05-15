import { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Result,
  Space,
  Steps,
  Typography,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { createWorkplace, createUser, completeOnboarding } from '../api/client.js';

type Props = {
  onDone: () => void;
};

export default function OnboardingWizard({ onDone }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workplaceForm] = Form.useForm();
  const [employeeForm] = Form.useForm();

  const handleStep1 = async () => {
    const values = await workplaceForm.validateFields();
    setLoading(true);
    try {
      await createWorkplace(values as { name: string; code: string });
      void message.success(t('onboarding.workplaceCreated'));
      setStep(1);
    } catch {
      void message.error(t('onboarding.errorWorkplace'));
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    const values = await employeeForm.validateFields();
    setLoading(true);
    try {
      await createUser({
        fullName: values.fullName as string,
        email: values.email as string,
        password: values.password as string,
      });
      void message.success(t('onboarding.employeeCreated'));
      setStep(2);
    } catch {
      void message.error(t('onboarding.errorEmployee'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
    } finally {
      setLoading(false);
      onDone();
    }
  };

  const handleSkip = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  return (
    <Modal
      open
      closable={false}
      maskClosable={false}
      footer={null}
      width={560}
      title={
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('onboarding.title')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
            {t('onboarding.subtitle')}
          </Typography.Text>
        </Space>
      }
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: t('onboarding.step1Title') },
          { title: t('onboarding.step2Title') },
          { title: t('onboarding.step3Title') },
        ]}
      />

      {step === 0 && (
        <Form form={workplaceForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('onboarding.workplaceName')}
            rules={[{ required: true, message: t('onboarding.workplaceNameRequired') }]}
          >
            <Input placeholder={t('onboarding.workplaceName')} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('onboarding.workplaceCode')}
            rules={[{ required: true, message: t('onboarding.workplaceCodeRequired') }]}
          >
            <Input placeholder="WP-01" />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => void handleSkip()}>
              {t('onboarding.skip')}
            </Button>
            <Button type="primary" loading={loading} onClick={() => void handleStep1()}>
              {t('onboarding.next')}
            </Button>
          </Space>
        </Form>
      )}

      {step === 1 && (
        <Form form={employeeForm} layout="vertical">
          <Form.Item
            name="fullName"
            label={t('onboarding.employeeFullName')}
            rules={[{ required: true, message: t('onboarding.employeeFullNameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('onboarding.employeeEmail')}
            rules={[
              { required: true, message: t('onboarding.employeeEmailRequired') },
              { type: 'email', message: t('onboarding.employeeEmailRequired') },
            ]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('onboarding.employeePassword')}
            rules={[{ required: true, message: t('onboarding.employeePasswordRequired') }]}
          >
            <Input.Password />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => void handleSkip()}>
              {t('onboarding.skip')}
            </Button>
            <Button type="primary" loading={loading} onClick={() => void handleStep2()}>
              {t('onboarding.next')}
            </Button>
          </Space>
        </Form>
      )}

      {step === 2 && (
        <Result
          status="success"
          title={t('onboarding.step3Title')}
          subTitle={t('onboarding.step3Desc')}
          extra={
            <Button type="primary" loading={loading} onClick={() => void handleFinish()}>
              {t('onboarding.start')}
            </Button>
          }
        />
      )}
    </Modal>
  );
}
