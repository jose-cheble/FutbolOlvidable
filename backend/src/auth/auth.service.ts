import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AuthProvider } from '../common/enums';
import { JwtTokenService } from './token/jwt-token.service';
import { LocalAuthStrategy } from './strategies/local-auth.strategy';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtTokenService: JwtTokenService,
    private readonly localStrategy: LocalAuthStrategy,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      authProvider: AuthProvider.LOCAL,
      providerId: null,
    });
    await this.usersRepo.save(user);

    const accessToken = this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async login(dto: LoginDto) {
    const authUser = await this.localStrategy.validate({
      email: dto.email.toLowerCase(),
      password: dto.password,
    });

    const accessToken = this.jwtTokenService.sign({
      sub: authUser.id,
      email: authUser.email,
    });

    return {
      accessToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      authProvider: user.authProvider,
    };
  }
}
