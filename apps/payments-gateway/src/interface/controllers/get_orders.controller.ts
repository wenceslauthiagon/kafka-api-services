import { Logger } from 'winston';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AxiosInstance } from 'axios';
import {
  AutoValidator,
  buildQueryString,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  ForbiddenException,
} from '@zro/common';
import { HttpStatus } from '@nestjs/common';
import { Wallet } from '@zro/operations/domain';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import { TGetOrderByIdResponse } from './get_order_by_id.controller';
import {
  Company,
  TCompany,
  TLinks,
  TMeta,
  Transaction,
  TTransaction,
} from './default';

type WalletId = Wallet['uuid'];

type TGetOrdersRequest = {
  wallet_id: WalletId;
  limit?: string;
  page?: string;
  id?: string;
  company_id?: string;
  transaction_id?: string;
  payment_status?: string;
  created_start_date?: string;
  created_end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  status?: string;
};

export class GetOrdersRequest
  extends AutoValidator
  implements TGetOrdersRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_status?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than created end date',
  })
  created_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'Created end date must be after than created start date',
  })
  created_end_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date updated start date',
  })
  @IsDateBeforeThan('updated_end_date', true, {
    message: 'Updated start date must be before than updated end date',
  })
  updated_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date updated end date',
  })
  @IsDateAfterThan('updated_start_date', true, {
    message: 'Updated end date must be after than updated start date',
  })
  updated_end_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  status?: string;

  constructor(props: TGetOrdersRequest) {
    super(props);
  }
}

export type TGetOrdersResponseItem = TGetOrderByIdResponse;

export class GetOrdersResponseItem
  extends AutoValidator
  implements TGetOrdersResponseItem
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

  constructor(props: TGetOrdersResponseItem) {
    super(props);
    this.company = new Company(props.company);
    this.transaction = new Transaction(props.transaction);
  }
}

export type TGetOrdersResponse = {
  data: TGetOrdersResponseItem[];
  links: TLinks;
  meta: TMeta;
};

export class GetOrdersResponse
  extends AutoValidator
  implements TGetOrdersResponse
{
  @IsArray()
  data: TGetOrdersResponseItem[];

  @IsObject()
  links: TLinks;

  @IsObject()
  meta: TMeta;

  constructor(props: TGetOrdersResponse) {
    super(props);
    this.data = props.data.map((item) => new GetOrdersResponseItem(item));
  }
}

export class GetOrdersController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetOrdersController.name,
    });
  }

  async execute(request: GetOrdersRequest): Promise<GetOrdersResponse> {
    this.logger.debug('Get orders request.', { request });

    Reflect.deleteProperty(request, 'wallet_id');

    try {
      const result = await this.axiosInstance.get<GetOrdersResponse>(
        buildQueryString(PAYMENTS_GATEWAY_SERVICES.ORDER, request),
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetOrdersResponse(result.data);

      this.logger.info('Get orders response.', {
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
