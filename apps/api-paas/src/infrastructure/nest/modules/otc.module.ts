import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  CreateConversionRestController,
  V2CreateConversionRestController,
  GetConversionCreditByUserRestController,
  V2GetConversionCreditByUserRestController,
  GetAllConversionRestController,
  V2GetAllConversionRestController,
  V3GetAllConversionRestController,
  GetQuotationByConversionIdRestController,
  GetConversionByIdRestController,
} from '@zro/api-paas/infrastructure';
import {
  CreateConversionServiceKafka,
  GetAllConversionServiceKafka,
  GetConversionByUserAndIdServiceKafka,
  GetConversionCreditByUserServiceKafka,
  GetQuotationByConversionIdAndUserServiceKafka,
} from '@zro/otc/infrastructure';

/**
 * Otc endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreateConversionServiceKafka,
      GetAllConversionServiceKafka,
      GetConversionCreditByUserServiceKafka,
      GetQuotationByConversionIdAndUserServiceKafka,
      GetConversionByUserAndIdServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    CreateConversionRestController,
    V2CreateConversionRestController,
    GetAllConversionRestController,
    V2GetAllConversionRestController,
    V3GetAllConversionRestController,
    GetConversionCreditByUserRestController,
    V2GetConversionCreditByUserRestController,
    GetQuotationByConversionIdRestController,
    GetConversionByIdRestController,
  ],
})
export class OtcModule {}
