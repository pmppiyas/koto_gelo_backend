export interface RefreshTokenPayload {
  id: string;
  username: string;
  email?: string | null;
  [key: string]: any;
}
