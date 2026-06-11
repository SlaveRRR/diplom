import * as z from 'zod';

import { passwordSchema, REQUIRED_FIELD_PLACEHOLDER } from '@constants';

export const signUpFormSchema = z.object({
  username: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }),
  email: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }).email({ message: 'Некорректный email' }).toLowerCase(),
  password: passwordSchema,
  policy: z.boolean({ message: 'Обязательное поле.' }),
});

export type SignUpFormSchema = z.infer<typeof signUpFormSchema>;
