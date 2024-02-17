import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
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
  buildQueryString,
  ForbiddenException,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
} from '@zro/common';
import { HttpStatus } from '@nestjs/common';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import { WalletId } from './default';

type TGetValidationKycCountRequest = {
  created_start_date?: string;
  created_end_date?: string;
};

export class GetValidationKycCountRequest
  extends AutoValidator
  implements TGetValidationKycCountRequest
{
  @IsUUID()
  wallet_id: WalletId;

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
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than created end date',
  })
  updated_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than created end date',
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
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  constructor(props: TGetValidationKycCountRequest) {
    super(props);
  }
}

type TGetValidationKycCountResponseItem = {
  total_items: number;
};

export type TGetValidationKycCountResponse = {
  data: TGetValidationKycCountResponseItem[];
};

export class GetValidationKycCountResponseItem
  extends AutoValidator
  implements TGetValidationKycCountResponseItem
{
  constructor(props: TGetValidationKycCountResponseItem) {
    super(props);
  }

  @IsOptional()
  @IsNumber()
  total_items: number;
}

export class GetValidationKycCountResponse
  extends AutoValidator
  implements TGetValidationKycCountResponse
{
  @IsArray()
  data: TGetValidationKycCountResponseItem[];

  constructor(props: TGetValidationKycCountResponse) {
    super(props);
  }
}

export class GetValidationKycCountController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetValidationKycCountController.name,
    });
  }

  async execute(
    request: GetValidationKycCountRequest,
  ): Promise<GetValidationKycCountResponse> {
    this.logger.debug('Get validation kyc count request.', {
      request,
    });

    Reflect.deleteProperty(request, 'wallet_id');

    const URL = buildQueryString(
      PAYMENTS_GATEWAY_SERVICES.VALIDATION_KYC,
      request,
    );

    try {
      const result =
        await this.axiosInstance.get<GetValidationKycCountResponseItem[]>(URL);

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data?.length) return null;

      const response = new GetValidationKycCountResponse({
        data: result.data.map(
          (res) => new GetValidationKycCountResponseItem(res),
        ),
      });

      this.logger.info('Get validation kyc count response.', {
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
