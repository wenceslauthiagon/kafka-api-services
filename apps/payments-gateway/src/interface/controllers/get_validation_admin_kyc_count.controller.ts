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

type TGetValidationAdminKycCountRequest = {
  created_start_date?: string;
  created_end_date?: string;
  company?: string;
};

export class GetValidationAdminKycCountRequest
  extends AutoValidator
  implements TGetValidationAdminKycCountRequest
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

  constructor(props: TGetValidationAdminKycCountRequest) {
    super(props);
  }
}

export type TGetValidationAdminKycCountResponse = {
  total: number;
};

export class GetValidationAdminKycCountResponse
  extends AutoValidator
  implements TGetValidationAdminKycCountResponse
{
  @IsNumber()
  total: number;

  constructor(props: TGetValidationAdminKycCountResponse) {
    super(props);
  }
}

export class GetValidationAdminKycCountController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetValidationAdminKycCountController.name,
    });
  }

  async execute(
    request: GetValidationAdminKycCountRequest,
  ): Promise<GetValidationAdminKycCountResponse> {
    this.logger.debug('Get validation admin kyc count request.', {
      request,
    });

    Reflect.deleteProperty(request, 'wallet_id');

    const URL = buildQueryString(
      PAYMENTS_GATEWAY_SERVICES.VALIDATION_ADMIN_KYC,
      request,
    );

    try {
      const result =
        await this.axiosInstance.get<GetValidationAdminKycCountResponse>(URL);

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetValidationAdminKycCountResponse(result.data);

      this.logger.info('Get validation admin kyc count response.', {
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
