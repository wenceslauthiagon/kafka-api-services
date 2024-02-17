import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, TranslateModule } from '@zro/common';
import {
  CreatePixKeyRestController,
  DeleteByIdPixKeyRestController,
  DismissByIdPixKeyRestController,
  GetAllPixKeyRestController,
  GetByIdPixKeyRestController,
} from '@zro/api-paas/infrastructure';
import {
  CreatePixKeyServiceKafka,
  DeleteByIdPixKeyServiceKafka,
  DismissByIdPixKeyServiceKafka,
  GetAllPixKeyServiceKafka,
  GetPixKeyByIdServiceKafka,
} from '@zro/pix-keys/infrastructure';

/**
 * PixKey endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreatePixKeyServiceKafka,
      GetAllPixKeyServiceKafka,
      GetPixKeyByIdServiceKafka,
      DeleteByIdPixKeyServiceKafka,
      DismissByIdPixKeyServiceKafka,
    ]),
    TranslateModule,
  ],
  controllers: [
    CreatePixKeyRestController,
    GetAllPixKeyRestController,
    GetByIdPixKeyRestController,
    DeleteByIdPixKeyRestController,
    DismissByIdPixKeyRestController,
  ],
})
export class PixKeyModule {}
