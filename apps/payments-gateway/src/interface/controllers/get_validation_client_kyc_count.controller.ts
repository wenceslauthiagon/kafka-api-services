import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
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

type TGetValidationClientKycCountRequest = {
  start_date?: string;
  end_date?: string;
  company?: string;
};

export class GetValidationClientKycCountRequest
  extends AutoValidator
  implements TGetValidationClientKycCountRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsString()
  @IsOptional()
  @Matches(/^$|^((random)|[0-9]+)$/, {
    message: 'company is not in the correct format',
  })
  company?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('end_date', true, {
    message: 'Created start date must be before than created end date',
  })
  start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('start_date', true, {
    message: 'Created end date must be after than created start date',
  })
  end_date?: string;

  constructor(props: TGetValidationClientKycCountRequest) {
    super(props);
  }
}

export type TGetValidationClientKycCountResponse = {
  total: number;
};

export class GetValidationClientKycCountResponse
  extends AutoValidator
  implements TGetValidationClientKycCountResponse
{
  @IsNumber()
  total: number;

  constructor(props: TGetValidationClientKycCountResponse) {
    super(props);
  }
}

export class GetValidationClientKycCountController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetValidationClientKycCountController.name,
    });
  }

  async execute(
    request: GetValidationClientKycCountRequest,
  ): Promise<GetValidationClientKycCountResponse> {
    this.logger.debug('Get validation client kyc count request.', {
      request,
    });

    Reflect.deleteProperty(request, 'wallet_id');

    const URL = buildQueryString(
      PAYMENTS_GATEWAY_SERVICES.VALIDATION_CLIENT_KYC,
      request,
    );

    try {
      const result =
        await this.axiosInstance.get<GetValidationClientKycCountResponse>(URL);

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetValidationClientKycCountResponse(result.data);

      this.logger.info('Get validation client kyc count  response.', {
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
