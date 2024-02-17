import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  BcryptModule,
  JwtModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  LocalStrategy,
  JwtStrategy,
  LoginAuthRestController,
  AccessTokenProvider,
  JwtAuthGuard,
} from '@zro/api-admin/infrastructure';
import { AdminModule } from './admin.module';

/**
 * Authentication enpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync(),
    LoggerModule,
    PassportModule,
    BcryptModule,
    ValidationModule,
    AdminModule,
  ],
  controllers: [LoginAuthRestController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    LocalStrategy,
    JwtStrategy,
    AccessTokenProvider,
  ],
})
export class AuthModule {}
