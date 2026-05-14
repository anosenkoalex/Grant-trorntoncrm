import { useEffect, useMemo, useState } from 'react';
import { Calendar, InputNumber, Modal, Spin, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export type WorkReportCalendarDay = {
  date: string;
  hours: number | null;
  hasAssignment?: boolean;
};

type WorkReportCalendarModalProps = {
  open: boolean;
  onClose: () => void;
  days: WorkReportCalendarDay[];
  loading?: boolean;
  onSaveDay: (date: string, hours: number | null) => Promise<void> | void;
  onMonthChange?: (from: string, to: string) => void;
};

type InternalDayMap = Record<string, WorkReportCalendarDay>;

export const WorkReportCalendarModal = ({
  open,
  onClose,
  days,
  loading = false,
  onSaveDay,
  onMonthChange,
}: WorkReportCalendarModalProps) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const dayMap: InternalDayMap = useMemo(() => {
    const map: InternalDayMap = {};
    for (const d of days) {
      map[d.date] = d;
    }
    return map;
  }, [days]);

  useEffect(() => {
    if (!open) return;

    const todayKey = dayjs().format('YYYY-MM-DD');
    const today = dayMap[todayKey];

    if (today) {
      setSelectedDate(dayjs(todayKey));
      setSelectedHours(today.hours ?? null);
    } else {
      const first = days[0];
      if (first) {
        setSelectedDate(dayjs(first.date));
        setSelectedHours(first.hours ?? null);
      } else {
        setSelectedDate(dayjs());
        setSelectedHours(null);
      }
    }
  }, [open, dayMap, days]);

  const handleSelect = (value: Dayjs) => {
    setSelectedDate(value);
    const key = value.format('YYYY-MM-DD');
    const info = dayMap[key];
    setSelectedHours(info ? (info.hours ?? null) : null);
  };

  const handlePanelChange = (value: Dayjs) => {
    if (onMonthChange) {
      const from = value.startOf('month').format('YYYY-MM-DD');
      const to = value.endOf('month').format('YYYY-MM-DD');
      onMonthChange(from, to);
    }
  };

  const handleSave = async () => {
    const dateKey = selectedDate.format('YYYY-MM-DD');

    if (selectedHours === null) {
      return;
    }

    try {
      setSaving(true);
      await onSaveDay(dateKey, selectedHours);
    } finally {
      setSaving(false);
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const key = value.format('YYYY-MM-DD');
    const info = dayMap[key];

    if (!info) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {info.hasAssignment && (
          <Tag color="processing" style={{ marginRight: 0 }}>
            {t('workReportModal.assignmentTag')}
          </Tag>
        )}
        {info.hours != null && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {info.hours} {t('automation.hoursUnit')}
          </Text>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={t('workReportModal.save')}
      confirmLoading={saving}
      width={900}
      title={t('workReportModal.title')}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <>
          <p>
            {t('workReportModal.description')}{' '}
            <Tag color="processing" style={{ margin: 0 }}>
              {t('workReportModal.assignmentTag')}
            </Tag>
            .
          </p>

          <Calendar
            fullscreen={false}
            value={selectedDate}
            onSelect={handleSelect}
            onPanelChange={handlePanelChange}
            dateCellRender={dateCellRender}
          />

          <div
            style={{
              marginTop: 16,
              paddingTop: 8,
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div>
              <Text type="secondary">{t('workReportModal.dateLabel')}</Text>{' '}
              <Text strong>{selectedDate.format('DD.MM.YYYY')}</Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text>{t('workReportModal.hoursLabel')}</Text>
              <InputNumber
                min={0}
                max={24}
                value={selectedHours as number | null}
                onChange={(v) => setSelectedHours(v ?? null)}
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
