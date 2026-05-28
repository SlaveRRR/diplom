import { render, screen } from '@testing-library/react';

import { MAX_SELECT_COUNT } from '@constants';

import { Select } from './Select';

const mockAntdSelect = vi.fn();

vi.mock('antd', () => ({
  Select: (props) => {
    mockAntdSelect(props);

    return (
      <div
        data-testid="antd-select"
        data-has-option-render={String(Boolean(props.optionRender))}
        data-max-count={String(props.maxCount)}
      >
        {props.placeholder}
      </div>
    );
  },
  Skeleton: {
    Node: ({ active, classNames }) => (
      <div data-testid="select-skeleton" data-active={String(active)} data-class-name={classNames?.content} />
    ),
  },
  Space: ({ children }) => <div>{children}</div>,
  Typography: {
    Text: ({ children }) => <span>{children}</span>,
  },
}));

describe('Select', () => {
  beforeEach(() => {
    mockAntdSelect.mockClear();
  });

  test('отображает плейсхолдер загрузки во время получения данных', () => {
    render(<Select isLoading className="custom-class" />);

    expect(screen.getByTestId('select-skeleton')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('select-skeleton')).toHaveAttribute('data-class-name', 'h-8 custom-class');
    expect(screen.queryByTestId('antd-select')).not.toBeInTheDocument();
  });

  test('после загрузки передает ограничение выбора и кастомный рендер опции в Select', () => {
    render(<Select placeholder="Жанры" isUseOptionsRender options={[{ label: 'Фэнтези', value: 1 }]} />);

    expect(screen.getByTestId('antd-select')).toHaveTextContent('Жанры');
    expect(screen.getByTestId('antd-select')).toHaveAttribute('data-max-count', String(MAX_SELECT_COUNT));
    expect(screen.getByTestId('antd-select')).toHaveAttribute('data-has-option-render', 'true');
    expect(mockAntdSelect).toHaveBeenCalledTimes(1);
  });
});
