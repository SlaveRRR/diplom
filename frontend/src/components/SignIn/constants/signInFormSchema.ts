import * as z from 'zod';

import { passwordSchema, REQUIRED_FIELD_PLACEHOLDER } from '@constants';

export const signInFormSchema = z.object({
  username: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }),
  password: passwordSchema,
  poilcy: z.boolean({ message: 'Обязательное поле.' }),
});

export type SignInFormSchema = z.infer<typeof signInFormSchema>;
