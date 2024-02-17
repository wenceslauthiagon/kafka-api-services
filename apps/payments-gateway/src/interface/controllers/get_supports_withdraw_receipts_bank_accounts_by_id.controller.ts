import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AutoValidator,
  buildQueryString,
  ForbiddenException,
} from '@zro/common';
import { HttpStatus } from '@nestjs/common';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import { WalletId } from './default';

type TGetWithdrawReceiptsBankAccountsRequest = {
  bank_account_id: number;
  end_to_end?: string;
  wallet_id: string;
};

export class GetWithdrawReceiptsBankAccountsRequest
  extends AutoValidator
  implements TGetWithdrawReceiptsBankAccountsRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsNumber()
  bank_account_id: number;

  @IsString()
  end_to_end: string;

  constructor(props: TGetWithdrawReceiptsBankAccountsRequest) {
    super(props);
  }
}

export type TGetWithdrawReceiptsBankAccountsResponse = {
  base64_receipt: string;
};

export class GetWithdrawReceiptsBankAccountsResponse
  extends AutoValidator
  implements TGetWithdrawReceiptsBankAccountsResponse
{
  @IsString()
  @IsOptional()
  base64_receipt: string;

  constructor(props: TGetWithdrawReceiptsBankAccountsResponse) {
    super(props);
  }
}

export class GetWithdrawReceiptsBankAccountsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetWithdrawReceiptsBankAccountsController.name,
    });
  }

  async execute(
    request: GetWithdrawReceiptsBankAccountsRequest,
  ): Promise<GetWithdrawReceiptsBankAccountsResponse> {
    this.logger.debug('Get support withdraw receipts bank accounts request.', {
      request,
    });

    const params = {
      end_to_end: request.end_to_end,
    };

    const URL = buildQueryString(
      `${PAYMENTS_GATEWAY_SERVICES.SUPPORTS_WITHDRAW_RECEIPTS}/${request.bank_account_id}`,
      params,
    );

    try {
      const result =
        await this.axiosInstance.get<GetWithdrawReceiptsBankAccountsResponse>(
          URL,
        );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetWithdrawReceiptsBankAccountsResponse(result.data);

      this.logger.info(
        'Get support withdraw receipts bank accounts response.',
        {
          response,
        },
      );

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
