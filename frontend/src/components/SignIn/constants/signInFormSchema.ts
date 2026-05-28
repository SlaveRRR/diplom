import * as z from 'zod';

import { passwordSchema, REQUIRED_FIELD_PLACEHOLDER } from '@constants';

export const signInFormSchema = z.object({
  username: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }),
  password: passwordSchema,
  privacyPolicy: z.boolean({ message: 'Необходимо подтвердить ознакомление с политикой конфиденциальности.' }),
  personalDataPolicy: z.boolean({
    message: 'Необходимо подтвердить ознакомление с политикой обработки персональных данных.',
  }),
});

export type SignInFormSchema = z.infer<typeof signInFormSchema>;
