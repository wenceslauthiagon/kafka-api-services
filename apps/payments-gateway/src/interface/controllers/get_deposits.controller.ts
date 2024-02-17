import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { IsArray, IsObject } from 'class-validator';
import {
  AutoValidator,
  buildQueryString,
  ForbiddenException,
} from '@zro/common';
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

type TGetDepositsRequest = TFiltersRequest;

export class GetDepositsRequest
  extends FiltersRequest
  implements TGetDepositsRequest
{
  constructor(props: TGetDepositsRequest) {
    super(props);
  }
}

export type TGetDepositsResponseItem = TTransactionResponseItem;

export type TGetDepositsResponse = {
  data: TGetDepositsResponseItem[];
  links: TLinks;
  meta: TMeta;
};

export class GetDepositsResponseItem
  extends TransactionResponseItem
  implements TGetDepositsResponseItem
{
  constructor(props: TGetDepositsResponseItem) {
    super(props);
  }
}

export class GetDepositsResponse
  extends AutoValidator
  implements TGetDepositsResponse
{
  @IsArray()
  data: TGetDepositsResponseItem[];

  @IsObject()
  links: TLinks;

  @IsObject()
  meta: TMeta;

  constructor(props: TGetDepositsResponse) {
    super(props);
    this.data = props.data.map((item) => new GetDepositsResponseItem(item));
  }
}

export class GetDepositsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetDepositsController.name,
    });
  }

  async execute(request: GetDepositsRequest): Promise<GetDepositsResponse> {
    this.logger.debug('Get deposits request.', { request });

    Reflect.deleteProperty(request, 'wallet_id');

    try {
      const result = await this.axiosInstance.get<GetDepositsResponse>(
        buildQueryString(PAYMENTS_GATEWAY_SERVICES.DEPOSIT, request),
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetDepositsResponse(result.data);

      this.logger.info('Get deposits response.', {
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
