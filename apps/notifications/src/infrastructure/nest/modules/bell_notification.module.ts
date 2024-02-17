import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  EncryptModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import {
  BellNotificationModel,
  CreateBellNotificationMicroserviceController,
  PixDepositStateChangeNotificationNestObserver,
  PaymentStateChangeNotificationNestObserver,
  PixDevolutionReceivedStateChangeNotificationNestObserver,
  PixDevolutionStateChangeNotificationNestObserver,
  WarningPixDepositStateChangeNotificationNestObserver,
} from '@zro/notifications/infrastructure';
import { GetUserByUuidServiceKafka } from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([GetUserByUuidServiceKafka]),
    DatabaseModule.forFeature([BellNotificationModel]),
    EncryptModule,
    TranslateModule,
  ],
  controllers: [
    CreateBellNotificationMicroserviceController,
    PixDepositStateChangeNotificationNestObserver,
    PaymentStateChangeNotificationNestObserver,
    PixDevolutionReceivedStateChangeNotificationNestObserver,
    PixDevolutionStateChangeNotificationNestObserver,
    WarningPixDepositStateChangeNotificationNestObserver,
  ],
})
export class BellNotificationModule {}
