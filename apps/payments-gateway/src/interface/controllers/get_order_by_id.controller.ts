import { Logger } from 'winston';
import {
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  ForbiddenException,
} from '@zro/common';
import {
  PaymentsGatewayException,
  OrderNotFoundException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import {
  Company,
  TCompany,
  Transaction,
  TTransaction,
  WalletId,
} from './default';

export type TGetOrderByIdRequest = {
  wallet_id: WalletId;
  id: number;
};

export class GetOrderByIdRequest
  extends AutoValidator
  implements TGetOrderByIdRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsPositive()
  id: number;

  constructor(props: TGetOrderByIdRequest) {
    super(props);
  }
}

export type TGetOrderByIdResponse = {
  id: number;
  value_cents: number;
  fee_in_percent?: string;
  company_id: number;
  transaction_id: number;
  total_value_shopkeeper_cents?: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  company?: TCompany;
  transaction?: TTransaction;
};

export class GetOrderByIdResponse
  extends AutoValidator
  implements TGetOrderByIdResponse
{
  @IsPositive()
  id: number;

  @IsPositive()
  value_cents: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fee_in_percent?: string;

  @IsPositive()
  company_id: number;

  @IsPositive()
  transaction_id: number;

  @IsOptional()
  @IsPositive()
  total_value_shopkeeper_cents?: number;

  @IsString()
  @Length(1, 2555)
  payment_status: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at: string;

  @IsOptional()
  @IsObject()
  company?: TCompany;

  @IsOptional()
  @IsObject()
  transaction?: TTransaction;

  constructor(props: TGetOrderByIdResponse) {
    super(props);
    this.company = new Company(props.company);
    this.transaction = new Transaction(props.transaction);
  }
}

export class GetOrderByIdController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetOrderByIdController.name,
    });
  }

  async execute(request: GetOrderByIdRequest): Promise<GetOrderByIdResponse> {
    this.logger.debug('Get order by id request.', { request });

    const { id } = request;

    try {
      const result = await this.axiosInstance.get<GetOrderByIdResponse>(
        `${PAYMENTS_GATEWAY_SERVICES.ORDER}/${id}`,
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetOrderByIdResponse(result.data);

      this.logger.info('Get order response.', {
        response,
      });

      return response;
    } catch (error) {
      if (
        error.isAxiosError &&
        error.response.status === HttpStatus.NOT_FOUND &&
        error.response.data
      ) {
        throw new OrderNotFoundException(error.response.data);
      } else if (
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
