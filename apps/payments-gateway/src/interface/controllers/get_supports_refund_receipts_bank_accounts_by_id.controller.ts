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

type TGetRefundReceiptsBankAccountsRequest = {
  bank_account_id: number;
  end_to_end?: string;
  wallet_id: string;
};

export class GetRefundReceiptsBankAccountsRequest
  extends AutoValidator
  implements TGetRefundReceiptsBankAccountsRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsNumber()
  bank_account_id: number;

  @IsString()
  end_to_end: string;

  constructor(props: TGetRefundReceiptsBankAccountsRequest) {
    super(props);
  }
}

export type TGetRefundReceiptsBankAccountsResponse = {
  base64_receipt: string;
};

export class GetRefundReceiptsBankAccountsResponse
  extends AutoValidator
  implements TGetRefundReceiptsBankAccountsResponse
{
  @IsString()
  @IsOptional()
  base64_receipt: string;

  constructor(props: TGetRefundReceiptsBankAccountsResponse) {
    super(props);
  }
}

export class GetRefundReceiptsBankAccountsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetRefundReceiptsBankAccountsController.name,
    });
  }

  async execute(
    request: GetRefundReceiptsBankAccountsRequest,
  ): Promise<GetRefundReceiptsBankAccountsResponse> {
    this.logger.debug('Get support refund receipts bank accounts request.', {
      request,
    });

    const params = {
      end_to_end: request.end_to_end,
    };

    const URL = buildQueryString(
      `${PAYMENTS_GATEWAY_SERVICES.SUPPORTS_REFUND_RECEIPTS}/${request.bank_account_id}`,
      params,
    );

    try {
      const result =
        await this.axiosInstance.get<GetRefundReceiptsBankAccountsResponse>(
          URL,
        );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetRefundReceiptsBankAccountsResponse(result.data);

      this.logger.info('Get support refund receipts bank accounts response.', {
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
