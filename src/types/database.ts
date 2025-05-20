
export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  updated_at?: string;
};

export type UserFormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};
