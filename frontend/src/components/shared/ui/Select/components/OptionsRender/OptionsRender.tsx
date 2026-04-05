import { SelectProps, Space, Typography } from 'antd';

import { SelectOption } from '@utils/select/types';

const { Text } = Typography;

export const OptionsRender: SelectProps['optionRender'] = ({ data }) => {
  const { description, label } = data as SelectOption;

  return (
    <Space orientation="vertical" size={2}>
      <Text className="font-medium text-slate-900">{label}</Text>
      <Text className="text-sm text-slate-500">{description}</Text>
    </Space>
  );
};
