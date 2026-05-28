import * as z from 'zod';

import { passwordSchema, REQUIRED_FIELD_PLACEHOLDER } from '@constants';

export const signUpFormSchema = z.object({
  username: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }),
  email: z.string({ message: REQUIRED_FIELD_PLACEHOLDER }).email().toLowerCase(),
  password: passwordSchema,
  userAgreement: z.boolean({ message: 'Необходимо подтвердить согласие с пользовательским соглашением.' }),
  privacyPolicy: z.boolean({ message: 'Необходимо подтвердить ознакомление с политикой конфиденциальности.' }),
  personalDataPolicy: z.boolean({
    message: 'Необходимо подтвердить ознакомление с политикой обработки персональных данных.',
  }),
});

export type SignUpFormSchema = z.infer<typeof signUpFormSchema>;
