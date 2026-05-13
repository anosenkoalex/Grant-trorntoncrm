import { Collapse } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile.js';

type Props = {
  children: ReactNode;
  label?: string;
  defaultOpen?: boolean;
  style?: React.CSSProperties;
};

export function MobileFilters({
  children,
  label = 'Фильтры',
  defaultOpen = false,
  style,
}: Props) {
  const isMobile = useIsMobile();

  if (!isMobile) return <>{children}</>;

  return (
    <Collapse
      size="small"
      style={{ marginBottom: 16, background: '#fafafa', ...style }}
      defaultActiveKey={defaultOpen ? ['f'] : []}
      items={[
        {
          key: 'f',
          label: (
            <span>
              <FilterOutlined style={{ marginRight: 6 }} />
              {label}
            </span>
          ),
          children: <div style={{ paddingTop: 4 }}>{children}</div>,
        },
      ]}
    />
  );
}
