import { Button, Flex, Popover, Tooltip, Typography } from 'antd';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';

import { ContentReactionSummary } from '@types';

const { Text } = Typography;

type ReactionsProps = {
  reactions: ContentReactionSummary[];
  loading?: boolean;
  onSelect: (emoji: string) => void | Promise<void>;
  pickerLabel?: string;
};

export const Reactions = ({ reactions, loading, onSelect, pickerLabel = 'Добавить реакцию' }: ReactionsProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleEmojiPick = (emojiData: EmojiClickData) => {
    setIsPickerOpen(false);
    void onSelect(emojiData.emoji);
  };

  return (
    <Flex gap={8} wrap="wrap" align="center">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          size="small"
          loading={loading}
          type={reaction.isSelected ? 'primary' : 'default'}
          className="!flex !h-8 !items-center !gap-1.5 !rounded-full !border-black/8 !px-2.5 !text-xs !shadow-none"
          onClick={() => void onSelect(reaction.emoji)}
        >
          <span aria-hidden className="text-base leading-none">
            {reaction.emoji}
          </span>
          <Text
            className={
              reaction.isSelected
                ? '!text-xs !font-medium !text-white/95'
                : '!text-xs !font-medium !text-[var(--color-text-secondary)]'
            }
          >
            {reaction.count}
          </Text>
        </Button>
      ))}

      <Tooltip title={pickerLabel}>
        <Popover
          trigger="click"
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          placement="top"
          arrow={false}
          destroyOnHidden
          getPopupContainer={() => document.body}
          overlayInnerStyle={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: 24,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
          }}
          content={
            <span>
              <EmojiPicker
                onEmojiClick={handleEmojiPick}
                autoFocusSearch={false}
                lazyLoadEmojis
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                searchDisabled={false}
                theme={Theme.LIGHT}
                width={320}
                height={420}
              />
            </span>
          }
        >
          <Button
            size="small"
            loading={loading}
            aria-label={pickerLabel}
            className="!flex !h-8 !w-8 !items-center !justify-center !rounded-full !border-dashed !border-black/10 !p-0 !shadow-none"
            icon={<PlusOutlined />}
          />
        </Popover>
      </Tooltip>
    </Flex>
  );
};
