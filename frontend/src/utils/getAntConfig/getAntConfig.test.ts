import { colors } from '@constants';

import { getAntConfig } from './getAntConfig';

vi.mock('antd', () => ({
  theme: {
    defaultAlgorithm: 'default-algorithm',
    darkAlgorithm: 'dark-algorithm',
  },
}));

describe('getAntConfig', () => {
  test('возвращает светлую конфигурацию по умолчанию', () => {
    const config = getAntConfig();

    expect(config.algorithm).toBe('default-algorithm');
    expect(config.token?.colorPrimary).toBe(colors.brand.primary);
    expect(config.token?.fontFamily).toContain('Manrope');
    expect(config.components?.Button?.borderRadius).toBe(8);
  });

  test('переключает algorithm для темной темы', () => {
    const config = getAntConfig('dark');

    expect(config.algorithm).toBe('dark-algorithm');
  });
});
