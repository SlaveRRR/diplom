import { fireEvent, render, screen } from '@testing-library/react';

import { FirstStep } from './FirstStep';

const mockSetTitle = vi.fn();
const mockSetDescription = vi.fn();
const mockSetAgeRating = vi.fn();
const mockSetTagIds = vi.fn();
const mockSetGenreId = vi.fn();

vi.mock('antd', () => ({
  Card: ({ children }) => <div>{children}</div>,
  Flex: ({ children }) => <div>{children}</div>,
  Space: ({ children }) => <div>{children}</div>,
  Input: Object.assign(({ value, onChange }) => <input value={value} onChange={onChange} />, {
    TextArea: ({ value, onChange }) => <textarea value={value} onChange={onChange} />,
  }),
  Typography: {
    Title: ({ children }) => <h3>{children}</h3>,
    Text: ({ children }) => <span>{children}</span>,
  },
}));

vi.mock('@hooks', () => ({
  usePlatformTaxonomy: () => ({
    isLoading: false,
    data: {
      ageRatings: [{ label: '16+', value: '16+' }],
      tags: [{ label: 'Fantasy', value: 2 }],
      genres: [{ label: 'Adventure', value: 7 }],
    },
  }),
}));

vi.mock('@components/ComicCreate/hooks', () => ({
  useComicCreateStore: () => ({
    title: 'Draft',
    description: 'Description',
    ageRating: '16+',
    tagIds: [2],
    genreId: 7,
    setTitle: mockSetTitle,
    setDescription: mockSetDescription,
    setAgeRating: mockSetAgeRating,
    setTagIds: mockSetTagIds,
    setGenreId: mockSetGenreId,
  }),
}));

vi.mock('@components/shared', () => ({
  Select: ({ onChange, mode, options }) => (
    <button
      data-testid={`select-${mode === 'multiple' ? 'multiple' : 'single'}`}
      onClick={() => onChange?.(mode === 'multiple' ? [options?.[0]?.value] : options?.[0]?.value)}
    >
      select
    </button>
  ),
}));

describe('FirstStep', () => {
  test('отображает базовые поля комикса и передает изменения в действия стора', () => {
    render(<FirstStep />);

    const [titleInput, descriptionInput] = screen.getAllByRole('textbox');
    fireEvent.change(titleInput, { target: { value: 'Moon Tower' } });
    fireEvent.change(descriptionInput, { target: { value: 'New story' } });
    fireEvent.click(screen.getAllByTestId('select-single')[0]);
    fireEvent.click(screen.getByTestId('select-multiple'));
    fireEvent.click(screen.getAllByTestId('select-single')[1]);

    expect(mockSetTitle).toHaveBeenCalledWith('Moon Tower');
    expect(mockSetDescription).toHaveBeenCalledWith('New story');
    expect(mockSetAgeRating).toHaveBeenCalledWith('16+');
    expect(mockSetTagIds).toHaveBeenCalledWith([2]);
    expect(mockSetGenreId).toHaveBeenCalledWith(7);
  });
});
