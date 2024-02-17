import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  DecodedPixKeyModel,
  PixKeyDecodeLimitModel,
  UserPixKeyDecodeLimitModel,
  CreateDecodedPixKeyMicroserviceController,
  DecodedPixKeyEventKafkaEmitterInit,
  GetByIdDecodedPixKeyMicroserviceController,
  UpdateStateByIdDecodedPixKeyMicroserviceController,
  NewDecodedPixKeyNestObserver,
} from '@zro/pix-keys/infrastructure';
import { GetUserByUuidServiceKafka } from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    RedisModule,
    KafkaModule.forFeature([GetUserByUuidServiceKafka]),
    DatabaseModule.forFeature([
      DecodedPixKeyModel,
      PixKeyDecodeLimitModel,
      UserPixKeyDecodeLimitModel,
    ]),
    JdpiPixModule,
  ],
  controllers: [
    CreateDecodedPixKeyMicroserviceController,
    GetByIdDecodedPixKeyMicroserviceController,
    UpdateStateByIdDecodedPixKeyMicroserviceController,
    NewDecodedPixKeyNestObserver,
  ],
  providers: [DecodedPixKeyEventKafkaEmitterInit],
})
export class DecodedPixKeyModule {}
