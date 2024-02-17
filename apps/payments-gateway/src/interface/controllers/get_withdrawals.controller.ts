import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { IsArray, IsObject } from 'class-validator';
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
import {
  FiltersRequest,
  TFiltersRequest,
  TLinks,
  TMeta,
  TransactionResponseItem,
  TTransactionResponseItem,
} from './default';

type TGetWithdrawalsRequest = TFiltersRequest;

export class GetWithdrawalsRequest
  extends FiltersRequest
  implements TGetWithdrawalsRequest
{
  constructor(props: TGetWithdrawalsRequest) {
    super(props);
  }
}

export type TGetWithdrawalsResponseItem = TTransactionResponseItem;

export type TGetWithdrawalsResponse = {
  data: TGetWithdrawalsResponseItem[];
  links: TLinks;
  meta: TMeta;
};

export class GetWithdrawalsResponseItem
  extends TransactionResponseItem
  implements TGetWithdrawalsResponseItem
{
  constructor(props: TGetWithdrawalsResponseItem) {
    super(props);
  }
}

export class GetWithdrawalsResponse
  extends AutoValidator
  implements TGetWithdrawalsResponse
{
  @IsArray()
  data: TGetWithdrawalsResponseItem[];

  @IsObject()
  links: TLinks;

  @IsObject()
  meta: TMeta;

  constructor(props: TGetWithdrawalsResponse) {
    super(props);
    this.data = props.data.map((item) => new GetWithdrawalsResponseItem(item));
  }
}

export class GetWithdrawalsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetWithdrawalsController.name,
    });
  }

  async execute(
    request: GetWithdrawalsRequest,
  ): Promise<GetWithdrawalsResponse> {
    this.logger.debug('Get withdrawals request.', { request });

    Reflect.deleteProperty(request, 'wallet_id');

    try {
      const result = await this.axiosInstance.get<GetWithdrawalsResponse>(
        buildQueryString(PAYMENTS_GATEWAY_SERVICES.WITHDRAWAL, request),
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetWithdrawalsResponse(result.data);

      this.logger.info('Get withdrawals response.', {
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
