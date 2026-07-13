import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';
import { VotesModule } from './votes/votes.module';
import { RankingsModule } from './rankings/rankings.module';
import { UploadModule } from './upload/upload.module';
import { SeedModule } from './database/seeds/seed.module';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { Player } from './entities/player.entity';
import { Match } from './entities/match.entity';
import { MatchTeam } from './entities/match-team.entity';
import { MatchLineup } from './entities/match-lineup.entity';
import { Vote } from './entities/vote.entity';
import { MvpVote } from './entities/mvp-vote.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User,
          Group,
          GroupMember,
          Player,
          Match,
          MatchTeam,
          MatchLineup,
          Vote,
          MvpVote,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: join(
            process.cwd(),
            config.get<string>('UPLOAD_PATH', './uploads'),
          ),
          serveRoot: '/uploads',
        },
      ],
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    PlayersModule,
    MatchesModule,
    VotesModule,
    RankingsModule,
    UploadModule,
    SeedModule,
  ],
})
export class AppModule {}
