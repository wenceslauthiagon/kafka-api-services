import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule as JwtNestModule } from '@nestjs/jwt';

export interface JwtConfig {
  APP_JWT_TOKEN: string;
  APP_JWT_IGNORE_EXPIRATION: boolean;
  APP_JWT_EXPIRES_IN: number;
  APP_JWT_VERSION: number;
  APP_REFRESH_TOKEN_TTL: number;
}

@Module({})
export class JwtModule {
  static registerAsync(): DynamicModule {
    return JwtNestModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<JwtConfig>) => ({
        secret: configService.get<string>('APP_JWT_TOKEN'),
        signOptions: {
          expiresIn: configService.get<number>('APP_JWT_EXPIRES_IN', 3600),
        },
      }),
      inject: [ConfigService],
    });
  }
}
