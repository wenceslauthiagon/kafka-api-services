import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  GetDepositByIdMicroserviceController,
  GetCompanyMicroserviceController,
  PaymentsGatewayAxiosService,
  GetDevolutionsMicroserviceController,
  GetDevolutionByIdMicroserviceController,
  GetDepositsMicroserviceController,
  GetOrderByIdMicroserviceController,
  GetOrdersMicroserviceController,
  GetOrdersRefundsMicroserviceController,
  GetOrderRefundsByIdMicroserviceController,
  GetRefundByIdMicroserviceController,
  GetRefundsMicroserviceController,
  GetWithdrawalByIdMicroserviceController,
  GetWithdrawalsMicroserviceController,
  CheckWalletsMicroserviceController,
  TransactionCronServiceInit,
  GetDashboardMicroserviceController,
  GetSupportsRefundReceiptsBankAccountsByIdMicroserviceController,
  GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController,
  GetValidationKycCountMicroserviceController,
  GetValidationAdminKycCountMicroserviceController,
  GetValidationClientKycCountMicroserviceController,
} from '@zro/payments-gateway/infrastructure';
import { CreateReportOperationByGatewayServiceKafka } from '@zro/reports/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([CreateReportOperationByGatewayServiceKafka]),
    RedisModule,
    DatabaseModule.forFeature([]),
  ],
  controllers: [
    GetDepositByIdMicroserviceController,
    GetCompanyMicroserviceController,
    GetDevolutionsMicroserviceController,
    GetDevolutionByIdMicroserviceController,
    GetDepositsMicroserviceController,
    GetOrderByIdMicroserviceController,
    GetOrdersMicroserviceController,
    GetOrdersRefundsMicroserviceController,
    GetOrderRefundsByIdMicroserviceController,
    GetRefundByIdMicroserviceController,
    GetRefundsMicroserviceController,
    GetWithdrawalByIdMicroserviceController,
    GetWithdrawalsMicroserviceController,
    CheckWalletsMicroserviceController,
    GetDashboardMicroserviceController,
    GetSupportsRefundReceiptsBankAccountsByIdMicroserviceController,
    GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController,
    GetValidationKycCountMicroserviceController,
    GetValidationAdminKycCountMicroserviceController,
    GetValidationClientKycCountMicroserviceController,
  ],
  providers: [PaymentsGatewayAxiosService, TransactionCronServiceInit],
})
export class PaymentsGatewayModule {}
