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

type TGetRefundsRequest = TFiltersRequest;

export class GetRefundsRequest
  extends FiltersRequest
  implements TGetRefundsRequest
{
  constructor(props: TGetRefundsRequest) {
    super(props);
  }
}

export type TGetRefundsResponseItem = TTransactionResponseItem;

export type TGetRefundsResponse = {
  data: TGetRefundsResponseItem[];
  links: TLinks;
  meta: TMeta;
};

export class GetRefundsResponseItem
  extends TransactionResponseItem
  implements TGetRefundsResponseItem
{
  constructor(props: TGetRefundsResponseItem) {
    super(props);
  }
}

export class GetRefundsResponse
  extends AutoValidator
  implements TGetRefundsResponse
{
  @IsArray()
  data: TGetRefundsResponseItem[];

  @IsObject()
  links: TLinks;

  @IsObject()
  meta: TMeta;

  constructor(props: TGetRefundsResponse) {
    super(props);
    this.data = props.data.map((item) => new GetRefundsResponseItem(item));
  }
}

export class GetRefundsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetRefundsController.name,
    });
  }

  async execute(request: GetRefundsRequest): Promise<GetRefundsResponse> {
    this.logger.debug('Get refunds request.', { request });

    Reflect.deleteProperty(request, 'wallet_id');

    try {
      const result = await this.axiosInstance.get<GetRefundsResponse>(
        buildQueryString(PAYMENTS_GATEWAY_SERVICES.REFUND, request),
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetRefundsResponse(result.data);

      this.logger.info('Get refunds response.', {
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
