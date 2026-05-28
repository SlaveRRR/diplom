import { convertIdNamedObjectToSelectOption } from './select';

describe('select utils', () => {
  test('преобразует поля id, name и description в опции Select по всем ключам объекта', () => {
    expect(
      convertIdNamedObjectToSelectOption({
        genres: [{ id: 1, name: 'Фэнтези', slug: '', description: 'Миры и магия' }],
        tags: [{ id: 11, name: 'Приключение', slug: '', description: 'Движение сюжета' }],
      }),
    ).toEqual({
      genres: [{ value: 1, label: 'Фэнтези', description: 'Миры и магия' }],
      tags: [{ value: 11, label: 'Приключение', description: 'Движение сюжета' }],
    });
  });
});
