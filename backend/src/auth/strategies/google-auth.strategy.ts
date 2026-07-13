import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  AuthCredentials,
  AuthProviderStrategy,
  AuthUserResult,
} from '../interfaces/auth-provider.interface';

/**
 * Stub vacío — OAuth Google NO implementado aún.
 * Cuando se active: passport-google-oauth20 + rutas /auth/google.
 */
@Injectable()
export class GoogleAuthStrategy implements AuthProviderStrategy {
  readonly name = 'google';

  async validate(_credentials: AuthCredentials): Promise<AuthUserResult> {
    throw new NotImplementedException(
      'Autenticación con Google aún no está habilitada',
    );
  }
}
