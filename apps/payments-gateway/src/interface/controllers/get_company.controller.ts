import { Logger } from 'winston';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  ForbiddenException,
} from '@zro/common';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { Wallet } from '@zro/operations/domain';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Bank, Company } from '@zro/payments-gateway/interface';

type WalletId = Wallet['uuid'];

type TGetCompanyRequest = {
  wallet_id: WalletId;
};

export class GetCompanyRequest
  extends AutoValidator
  implements TGetCompanyRequest
{
  @IsUUID()
  wallet_id: WalletId;

  constructor(props: TGetCompanyRequest) {
    super(props);
  }
}

export interface TGetCompanyResponse {
  id?: number;
  ie?: string;
  name?: string;
  cnpj?: string;
  phone?: string;
  is_matrix?: boolean;
  trading_name?: string;
  plan_id?: number;
  responsible_id?: number;
  wallet_id?: string;
  webhook_transaction?: string;
  webhook_withdraw?: string;
  created_at?: string;
  updated_at?: string;
  branches?: Company[];
  bank_accounts?: Bank[];
  active_bank_for_cash_in?: Bank;
  active_bank_for_cash_out?: Bank;
}

export class GetCompanyResponse
  extends AutoValidator
  implements TGetCompanyResponse
{
  @IsOptional()
  @IsPositive()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ie?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  is_matrix?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  trading_name?: string;

  @IsOptional()
  @IsPositive()
  plan_id?: number;

  @IsOptional()
  @IsPositive()
  responsible_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  wallet_id?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  webhook_transaction?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  webhook_withdraw?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at?: string;

  @IsArray()
  @IsOptional()
  branches?: Company[];

  @IsArray()
  @IsOptional()
  bank_accounts?: Bank[];

  @IsObject()
  @IsOptional()
  active_bank_for_cash_in?: Bank;

  @IsObject()
  @IsOptional()
  active_bank_for_cash_out?: Bank;

  constructor(props: TGetCompanyResponse) {
    super(props);
  }
}

export class GetCompanyController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetCompanyController.name,
    });
  }

  async execute(request: GetCompanyRequest): Promise<GetCompanyResponse> {
    this.logger.debug('Get company request.', { request });

    try {
      const result = await this.axiosInstance.get<GetCompanyResponse>(
        PAYMENTS_GATEWAY_SERVICES.COMPANY,
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetCompanyResponse(result.data);

      this.logger.info('Get company response.', {
        response,
      });

      return response;
    } catch (error) {
      if (
        error.isAxiosError &&
        error.response.status === HttpStatus.FORBIDDEN
      ) {
        throw new ForbiddenException(error.response.data);
      }

      this.logger.error('Unexpected payments gateway error.', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PaymentsGatewayException(error);
    }
  }
}
