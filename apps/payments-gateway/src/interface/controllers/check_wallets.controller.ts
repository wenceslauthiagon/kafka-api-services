import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { AutoValidator, ForbiddenException } from '@zro/common';
import { HttpStatus } from '@nestjs/common';
import {
  PaymentsGatewayException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';

type TCheckWalletsRequest = {
  wallets_ids: string[];
};

export class CheckWalletsRequest
  extends AutoValidator
  implements TCheckWalletsRequest
{
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  wallets_ids: string[];

  constructor(props: TCheckWalletsRequest) {
    super(props);
  }
}

export type TCheckWalletsResponse = { data: string[] };

export class CheckWalletsResponse
  extends AutoValidator
  implements TCheckWalletsResponse
{
  @IsArray()
  @IsUUID(4, { each: true })
  data: string[];

  constructor(props: TCheckWalletsResponse) {
    super(props);
  }
}

export class CheckWalletsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: CheckWalletsController.name,
    });
  }

  async execute(request: CheckWalletsRequest): Promise<CheckWalletsResponse> {
    this.logger.debug('Check wallets request.', { request });

    try {
      const result = await this.axiosInstance.post<string[]>(
        PAYMENTS_GATEWAY_SERVICES.WALLETS,
        { wallets: request.wallets_ids },
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new CheckWalletsResponse({ data: result.data });

      this.logger.info('Check wallets response.', {
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
