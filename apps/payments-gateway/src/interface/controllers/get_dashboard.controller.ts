import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  ForbiddenException,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
} from '@zro/common';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';

type TGetDashboardRequest = {
  created_start_date?: string;
  created_end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  wallets?: string[];
  wallet_id?: string;
  limit?: string;
  page?: string;
};

export class GetDashboardRequest
  extends AutoValidator
  implements TGetDashboardRequest
{
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than created end date',
  })
  created_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'Created end date must be after than created start date',
  })
  created_end_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated start date',
  })
  @IsDateBeforeThan('updated_end_date', true, {
    message: 'Updated start date must be before than updated end date',
  })
  updated_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated end date',
  })
  @IsDateAfterThan('updated_start_date', true, {
    message: 'Updated end date must be after than updated start date',
  })
  updated_end_date?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  wallets?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  wallet_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  constructor(props: TGetDashboardRequest) {
    super(props);
  }
}

export type TGetDashboardResponseItem = {
  type: string;
  status: string;
  total_items: number;
  total_value: number;
};

export type TGetDashboardResponse = {
  data: TGetDashboardResponseItem[];
};

export class GetDashboardResponseItem
  extends AutoValidator
  implements TGetDashboardResponseItem
{
  constructor(props: TGetDashboardResponseItem) {
    super(props);
  }

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  status: string;

  @IsOptional()
  @IsNumber()
  total_items: number;

  @IsOptional()
  @IsNumber()
  total_value: number;
}

export class GetDashboardResponse
  extends AutoValidator
  implements TGetDashboardResponse
{
  @IsArray()
  data: TGetDashboardResponseItem[];

  constructor(props: TGetDashboardResponse) {
    super(props);
  }
}

export class GetDashboardController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetDashboardController.name,
    });
  }

  async execute(request: GetDashboardRequest): Promise<GetDashboardResponse> {
    this.logger.debug('Get dashboard request.', { request });

    const params = {
      created_start_date: request.created_start_date,
      created_end_date: request.created_end_date,
      updated_start_date: request.updated_start_date,
      updated_end_date: request.updated_end_date,
      wallets: request.wallets,
      page: request.page,
      limit: request.limit,
    };

    try {
      const result = await this.axiosInstance.get<GetDashboardResponseItem[]>(
        PAYMENTS_GATEWAY_SERVICES.DASHBOARD,
        {
          params,
        },
      );
      this.logger.debug('Response found.', { data: result.data });

      if (!result.data?.length) return null;

      const response = new GetDashboardResponse({
        data: result.data.map((res) => new GetDashboardResponseItem(res)),
      });

      this.logger.info('Get dashboard response.', {
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
