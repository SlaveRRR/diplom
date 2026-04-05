import { Select as AntdSelect, Skeleton } from 'antd';
import { clsx } from 'clsx';
import { FC } from 'react';

import { MAX_SELECT_COUNT } from '@constants';

import { OptionsRender } from './components';
import { SelectProps } from './types';

export const Select: FC<SelectProps> = ({ isLoading, isUseOptionsRender, ...props }) =>
  isLoading ? (
    <Skeleton.Node
      active
      classNames={{
        content: clsx('h-8', props?.className),
      }}
    />
  ) : (
    <AntdSelect
      {...(isUseOptionsRender && {
        optionRender: OptionsRender,
      })}
      maxCount={MAX_SELECT_COUNT}
      {...props}
    />
  );
