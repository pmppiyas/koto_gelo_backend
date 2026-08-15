export interface AccessTokenPayload {
  id: string;
  username: string;
  email?: string | null;
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
