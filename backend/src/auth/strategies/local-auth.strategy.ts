import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { AuthProvider } from '../../common/enums';
import {
  AuthCredentials,
  AuthProviderStrategy,
  AuthUserResult,
} from '../interfaces/auth-provider.interface';

@Injectable()
export class LocalAuthStrategy implements AuthProviderStrategy {
  readonly name = 'local';

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async validate(credentials: AuthCredentials): Promise<AuthUserResult> {
    const { email, password } = credentials;
    if (!email || !password) {
      throw new UnauthorizedException('Email y contraseña requeridos');
    }

    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || user.authProvider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return { id: user.id, email: user.email, displayName: user.displayName };
  }
}
