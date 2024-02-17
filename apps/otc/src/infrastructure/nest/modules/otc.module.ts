import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  PrometheusModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  RemittanceOrderModel,
  RemittanceModel,
  SystemModel,
  ProviderModel,
  ExchangeContractModel,
  SpreadModel,
  GetAllProviderMicroserviceController,
  GetSystemByIdMicroserviceController,
  GetByIdProviderMicroserviceController,
  GetAllSystemMicroserviceController,
  CreateProviderMicroserviceController,
  GetByNameProviderMicroserviceController,
  UpdateExchangeContractMicroserviceController,
  ExchangeContractEventKafkaEmitterInit,
  GetAllExchangeContractMicroserviceController,
  GenerateExchangeContractWorksheetMicroserviceController,
  UploadExchangeContractFileMicroserviceController,
  RemoveExchangeContractFileMicroserviceController,
  CreateSpreadMicroserviceController,
  DeleteSpreadMicroserviceController,
  GetAllSpreadMicroserviceController,
  GetSpreadByIdMicroserviceController,
  GetSpreadByCurrencyMicroserviceController,
  GetSpreadByUserAndCurrencyMicroserviceController,
  GetSpreadsByUserAndCurrenciesMicroserviceController,
  CryptoOrderModel,
  ConversionModel,
  CashbackModel,
  CreateConversionMicroserviceController,
  CryptoRemittanceModel,
  CreateCashbackMicroserviceController,
  GetConversionCreditByUserMicroserviceController,
  SyncMarketPendingCryptoOrdersCronService,
  CreateCryptoRemittanceMicroserviceController,
  UpdateCryptoRemittanceMicroserviceController,
  GetCryptoRemittanceByIdMicroserviceController,
  CreateCryptoOrderMicroserviceController,
  UpdateCryptoOrderMicroserviceController,
  GetCryptoOrderByIdMicroserviceController,
  GetSystemByNameMicroserviceController,
  GetAllConversionMicroserviceController,
  GetConversionByUserAndIdMicroserviceController,
  GetQuotationByConversionIdAndUserMicroserviceController,
  GetConversionReceiptByUserAndOperationMicroserviceController,
  RemittanceExposureRuleModel,
  FilledCryptoRemittanceNestObserver,
  SyncCreateRemittanceCronService,
  ExchangeQuotationModel,
  CreateAndAcceptExchangeQuotationNestObserver,
  RejectExchangeQuotationNestObserver,
  CreateRemittanceExposureRuleMicroserviceController,
  UpdateRemittanceExposureRuleMicroserviceController,
  GetAllRemittanceExposureRuleMicroserviceController,
  ManuallyCloseRemittanceMicroserviceController,
  GetAllExchangeQuotationMicroserviceController,
  RemittanceExchangeQuotationModel,
  GetCryptoReportByCurrencyAndFormatMicroserviceController,
  CryptoReportModel,
  UpdateCryptoReportCronServiceInit,
  GetConversionByOperationMicroserviceController,
  GetCryptoPriceByCurrencyAndDateMicroserviceController,
  RemittanceOrderRemittanceModel,
  SyncOpenRemittanceCronService,
  SyncStateExchangeQuotationCronService,
  ClosedRemittanceNestObserver,
  GetRemittanceByIdMicroserviceController,
  CreateRemittanceOrderMicroserviceController,
  GetAllRemittanceOrdersByFilterMicroserviceController,
  GetRemittanceOrderByIdMicroserviceController,
  GetAllRemittanceMicroserviceController,
} from '@zro/otc/infrastructure';
import { B2C2CryptoRemittanceModule } from '@zro/b2c2';
import {
  TopazioExchangeContractModule,
  TopazioExchangeQuotationModule,
} from '@zro/topazio';
import { MercadoBitcoinHistoricalCryptoPriceModule } from '@zro/mercado-bitcoin';
import {
  GetCurrencyByTagServiceKafka,
  CreateCurrencyServiceKafka,
  GetCurrencyBySymbolServiceKafka,
  CreateOperationServiceKafka,
  AcceptOperationServiceKafka,
  CreateAndAcceptOperationServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  GetAllCurrencyServiceKafka,
  GetLimitTypesByFilterServiceKafka,
  GetUserLimitsByFilterServiceKafka,
  GetCurrencyByIdServiceKafka,
  GetAllWalletByUserServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
} from '@zro/operations/infrastructure';
import { UpdateBotOtcOrderByRemittanceServiceKafka } from '@zro/otc-bot/infrastructure';
import {
  CreateQuotationServiceKafka,
  GetQuotationByIdServiceKafka,
  GetCurrentQuotationByIdServiceKafka,
  GetQuotationServiceKafka,
  GetStreamQuotationByBaseCurrencyServiceKafka,
  GetHolidayByDateServiceKafka,
} from '@zro/quotations/infrastructure';
import {
  GetUserByUuidServiceKafka,
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
} from '@zro/users/infrastructure';
import { GetFeatureSettingByNameServiceKafka } from '@zro/utils/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetCurrencyByTagServiceKafka,
      CreateCurrencyServiceKafka,
      GetCurrencyBySymbolServiceKafka,
      CreateOperationServiceKafka,
      AcceptOperationServiceKafka,
      CreateAndAcceptOperationServiceKafka,
      GetWalletAccountByWalletAndCurrencyServiceKafka,
      GetAllCurrencyServiceKafka,
      GetLimitTypesByFilterServiceKafka,
      GetUserLimitsByFilterServiceKafka,
      GetCurrencyByIdServiceKafka,
      GetAllWalletByUserServiceKafka,
      GetWalletByUserAndDefaultIsTrueServiceKafka,
      UpdateBotOtcOrderByRemittanceServiceKafka,
      CreateQuotationServiceKafka,
      GetQuotationByIdServiceKafka,
      GetCurrentQuotationByIdServiceKafka,
      GetQuotationServiceKafka,
      GetStreamQuotationByBaseCurrencyServiceKafka,
      GetHolidayByDateServiceKafka,
      GetUserByUuidServiceKafka,
      GetOnboardingByUserAndStatusIsFinishedServiceKafka,
      GetFeatureSettingByNameServiceKafka,
    ]),
    RedisModule,
    PrometheusModule,
    DatabaseModule.forFeature([
      RemittanceOrderModel,
      RemittanceModel,
      SystemModel,
      ProviderModel,
      ExchangeContractModel,
      SpreadModel,
      CryptoOrderModel,
      ConversionModel,
      CryptoRemittanceModel,
      CashbackModel,
      RemittanceExposureRuleModel,
      ExchangeQuotationModel,
      RemittanceExchangeQuotationModel,
      CryptoReportModel,
      RemittanceOrderRemittanceModel,
    ]),
    B2C2CryptoRemittanceModule,
    TopazioExchangeQuotationModule,
    TopazioExchangeContractModule,
    MercadoBitcoinHistoricalCryptoPriceModule,
  ],
  controllers: [
    CreateProviderMicroserviceController,
    GetAllProviderMicroserviceController,
    GetByIdProviderMicroserviceController,
    GetByNameProviderMicroserviceController,
    GetAllSystemMicroserviceController,
    GetSystemByIdMicroserviceController,
    GetSystemByNameMicroserviceController,
    UpdateExchangeContractMicroserviceController,
    GetAllExchangeContractMicroserviceController,
    GenerateExchangeContractWorksheetMicroserviceController,
    UploadExchangeContractFileMicroserviceController,
    RemoveExchangeContractFileMicroserviceController,
    CreateSpreadMicroserviceController,
    DeleteSpreadMicroserviceController,
    GetAllSpreadMicroserviceController,
    GetSpreadByIdMicroserviceController,
    GetSpreadByCurrencyMicroserviceController,
    GetSpreadByUserAndCurrencyMicroserviceController,
    GetSpreadsByUserAndCurrenciesMicroserviceController,
    CreateConversionMicroserviceController,
    CreateCashbackMicroserviceController,
    GetConversionCreditByUserMicroserviceController,
    CreateCryptoRemittanceMicroserviceController,
    UpdateCryptoRemittanceMicroserviceController,
    GetCryptoRemittanceByIdMicroserviceController,
    CreateCryptoOrderMicroserviceController,
    UpdateCryptoOrderMicroserviceController,
    GetCryptoOrderByIdMicroserviceController,
    GetAllConversionMicroserviceController,
    GetConversionByUserAndIdMicroserviceController,
    GetQuotationByConversionIdAndUserMicroserviceController,
    GetConversionReceiptByUserAndOperationMicroserviceController,
    FilledCryptoRemittanceNestObserver,
    CreateAndAcceptExchangeQuotationNestObserver,
    RejectExchangeQuotationNestObserver,
    CreateRemittanceExposureRuleMicroserviceController,
    UpdateRemittanceExposureRuleMicroserviceController,
    GetAllRemittanceExposureRuleMicroserviceController,
    CreateRemittanceOrderMicroserviceController,
    GetAllExchangeQuotationMicroserviceController,
    GetCryptoReportByCurrencyAndFormatMicroserviceController,
    GetConversionByOperationMicroserviceController,
    GetCryptoPriceByCurrencyAndDateMicroserviceController,
    ClosedRemittanceNestObserver,
    GetRemittanceByIdMicroserviceController,
    GetAllRemittanceOrdersByFilterMicroserviceController,
    GetRemittanceOrderByIdMicroserviceController,
    GetAllRemittanceMicroserviceController,
    ManuallyCloseRemittanceMicroserviceController,
  ],
  providers: [
    ExchangeContractEventKafkaEmitterInit,
    SyncMarketPendingCryptoOrdersCronService,
    SyncCreateRemittanceCronService,
    UpdateCryptoReportCronServiceInit,
    SyncOpenRemittanceCronService,
    SyncStateExchangeQuotationCronService,
  ],
})
export class OtcModule {}