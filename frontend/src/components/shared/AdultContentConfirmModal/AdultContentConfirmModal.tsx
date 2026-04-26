import { Button, Flex, Modal, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import { colors } from '@constants';

const { Paragraph, Text, Title } = Typography;

type AdultContentConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const AdultContentConfirmModal = ({ open, onConfirm, onCancel }: AdultContentConfirmModalProps) => (
  <Modal
    open={open}
    footer={null}
    centered
    maskClosable={false}
    closable
    closeIcon={<CloseOutlined style={{ color: colors.text.accent, fontSize: 18 }} />}
    onCancel={onCancel}
    width={640}
    classNames={{
      body: 'p-3',
    }}
  >
    <Flex
      vertical
      gap={24}
      className="overflow-hidden rounded-[28px] px-6 py-6"
      style={{
        background:
          `radial-gradient(circle at top left, ${colors.surface.brandSubtle} 0, transparent 32%), ` +
          `linear-gradient(180deg, ${colors.white} 0%, ${colors.gray[10]} 100%)`,
        boxShadow: '0 24px 64px rgba(32, 20, 82, 0.16)',
      }}
    >
      <Flex align="center" gap={12}>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-semibold text-white"
          style={{
            background: `linear-gradient(180deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
            boxShadow: '0 12px 24px rgba(114, 84, 230, 0.18)',
          }}
        >
          18+
        </div>
        <Flex vertical gap={2}>
          <Text className="!text-xs !font-semibold !uppercase !tracking-[0.18em] !text-[var(--color-text-muted)]">
            Ограничение доступа
          </Text>
          <Title level={3} className="!mb-0 !text-[28px] !leading-tight !text-[var(--color-text-primary)]">
            Взрослый контент
          </Title>
        </Flex>
      </Flex>

      <Paragraph className="!mb-0 !max-w-[520px] !text-base !leading-7 !text-[var(--color-text-secondary)]">
        Этот материал отмечен как 18+. Перед просмотром нужно подтвердить, что вам уже исполнилось 18 лет.
      </Paragraph>
      <Flex gap={12} wrap justify="end">
        <Button
          size="large"
          className="min-w-[200px] !border-[var(--color-border-subtle)] !bg-white !text-[var(--color-text-secondary)] hover:!border-[var(--color-brand-primary)] hover:!text-[var(--color-brand-primary)]"
          onClick={onCancel}
        >
          Не открывать
        </Button>
        <Button type="primary" size="large" className="min-w-[200px]" onClick={onConfirm}>
          Подтвердить и открыть
        </Button>
      </Flex>
    </Flex>
  </Modal>
);
