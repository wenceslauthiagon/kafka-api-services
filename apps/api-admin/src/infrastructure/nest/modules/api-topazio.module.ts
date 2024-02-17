import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import { ReprocessPixStatementRestController } from '@zro/api-admin/infrastructure';
import { ReprocessPixStatementServiceKafka } from '@zro/api-topazio/infrastructure';

/**
 * Topazio endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([ReprocessPixStatementServiceKafka]),
  ],
  providers: [],
  controllers: [ReprocessPixStatementRestController],
})
export class ApiTopazioModule {}
