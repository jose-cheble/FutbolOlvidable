export interface AuthCredentials {
  email?: string;
  password?: string;
  providerId?: string;
}

export interface AuthUserResult {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthProviderStrategy {
  readonly name: string;
  validate(credentials: AuthCredentials): Promise<AuthUserResult>;
}
