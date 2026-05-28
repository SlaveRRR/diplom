import { z } from 'zod';
import { renderHook } from '@testing-library/react';

import { useForm } from './useForm';

const testSchema = z.object({
  username: z.string(),
});

describe('useForm', () => {
  test('проверка работы хука', () => {
    const { result } = renderHook(() => useForm(testSchema));

    expect(result.current.formState.isValid).toBe(false);
    expect(result.current.register).toBeDefined();
  });
});
