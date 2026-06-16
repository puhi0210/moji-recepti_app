export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: number;
  email: string;
  fullName?: string | null;
  name?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponseData = {
  user: AuthUser;
  tokens: AuthTokens;
};