import { Logger } from 'winston';
import {
  IsInt,
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

export type TGetOrderRefundsByIdRequest = {
  wallet_id: WalletId;
  id: number;
};

export class GetOrderRefundsByIdRequest
  extends AutoValidator
  implements TGetOrderRefundsByIdRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsPositive()
  id: number;

  constructor(props: TGetOrderRefundsByIdRequest) {
    super(props);
  }
}

export type TGetOrderRefundsByIdResponse = {
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

export class GetOrderRefundsByIdResponse
  extends AutoValidator
  implements TGetOrderRefundsByIdResponse
{
  @IsPositive()
  id: number;

  @IsInt()
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

  constructor(props: TGetOrderRefundsByIdResponse) {
    super(props);
    this.company = props.company && new Company(props.company);
    this.transaction = props.transaction && new Transaction(props.transaction);
  }
}

export class GetOrderRefundsByIdController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetOrderRefundsByIdController.name,
    });
  }

  async execute(
    request: GetOrderRefundsByIdRequest,
  ): Promise<GetOrderRefundsByIdResponse> {
    this.logger.debug('Get order refunds by id request.', { request });

    const { id } = request;

    try {
      const result = await this.axiosInstance.get<GetOrderRefundsByIdResponse>(
        `${PAYMENTS_GATEWAY_SERVICES.ORDER_REFUNDS}/${id}`,
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetOrderRefundsByIdResponse(result.data);

      this.logger.info('Get order refunds by id response.', {
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
