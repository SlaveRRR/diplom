export interface User {
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  avatar?: string | null;
  role: string;
}
