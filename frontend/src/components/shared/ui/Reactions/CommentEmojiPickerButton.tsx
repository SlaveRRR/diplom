import { Button, Popover, Tooltip } from 'antd';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useState } from 'react';
import { SmileOutlined } from '@ant-design/icons';

type CommentEmojiPickerButtonProps = {
  disabled?: boolean;
  label?: string;
  onSelect: (emoji: string) => void;
};

export const CommentEmojiPickerButton = ({
  disabled,
  label = 'Добавить эмодзи',
  onSelect,
}: CommentEmojiPickerButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiPick = (emojiData: EmojiClickData) => {
    setIsOpen(false);
    onSelect(emojiData.emoji);
  };

  return (
    <Tooltip title={label}>
      <Popover
        trigger="click"
        open={isOpen}
        onOpenChange={setIsOpen}
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
          aria-label={label}
          disabled={disabled}
          className="!inline-flex !items-center !justify-center !rounded-xl !border-black/8"
          icon={<SmileOutlined />}
        />
      </Popover>
    </Tooltip>
  );
};
