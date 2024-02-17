import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  GetAllWalletAccountRestController,
  CreateP2PTransferRestController,
  GetAllCurrencyRestController,
  GetWalletByIdRestController,
  GetAllWalletRestController,
  CreateWalletRestController,
  UpdateWalletRestController,
  DeleteWalletRestController,
  GetAllOperationsRestController,
  GetOperationByIdRestController,
  GetWalletAccountByIdRestController,
  GetOperationReceiptByIdRestController,
  GetStatementRestController,
} from '@zro/api-paas/infrastructure';
import {
  CreateActiveWalletServiceKafka,
  CreateP2PTransferServiceKafka,
  DeleteWalletByUuidAndUserServiceKafka,
  GetAllCurrencyServiceKafka,
  GetAllOperationsByUserAndWalletAndFilterServiceKafka,
  GetAllPermissionActionByPermissionTypesServiceKafka,
  GetAllUserWalletByUserServiceKafka,
  GetAllWalletAccountServiceKafka,
  GetOperationByUserAndWalletAndIdServiceKafka,
  GetOperationReceiptByUserAndWalletAndIdServiceKafka,
  GetStatementServiceKafka,
  GetUserWalletByUserAndWalletServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  GetWalletAccountByWalletAndUuidServiceKafka,
  UpdateWalletByUuidAndUserServiceKafka,
} from '@zro/operations/infrastructure';

/**
 * Operations endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetOperationReceiptByUserAndWalletAndIdServiceKafka,
      GetOperationByUserAndWalletAndIdServiceKafka,
      GetStatementServiceKafka,
      GetAllOperationsByUserAndWalletAndFilterServiceKafka,
      GetAllCurrencyServiceKafka,
      GetAllPermissionActionByPermissionTypesServiceKafka,
      GetWalletAccountByWalletAndCurrencyServiceKafka,
      GetWalletAccountByWalletAndUuidServiceKafka,
      GetAllWalletAccountServiceKafka,
      GetUserWalletByUserAndWalletServiceKafka,
      DeleteWalletByUuidAndUserServiceKafka,
      GetAllUserWalletByUserServiceKafka,
      UpdateWalletByUuidAndUserServiceKafka,
      CreateActiveWalletServiceKafka,
      CreateP2PTransferServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    CreateP2PTransferRestController,
    CreateWalletRestController,
    UpdateWalletRestController,
    DeleteWalletRestController,
    GetAllWalletRestController,
    GetWalletByIdRestController,
    GetAllWalletAccountRestController,
    GetWalletAccountByIdRestController,
    GetAllCurrencyRestController,
    GetAllOperationsRestController,
    GetStatementRestController,
    GetOperationByIdRestController,
    GetOperationReceiptByIdRestController,
  ],
})
export class OperationModule {}
