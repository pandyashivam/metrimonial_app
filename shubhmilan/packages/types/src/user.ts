export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface PublicUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: PublicUser;
  tokens: AuthTokens;
}
