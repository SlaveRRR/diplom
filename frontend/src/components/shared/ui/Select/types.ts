import { SelectProps as AntdSelectProps } from 'antd';

export interface SelectProps extends AntdSelectProps {
  isLoading?: boolean;
  isUseOptionsRender?: boolean;
}
