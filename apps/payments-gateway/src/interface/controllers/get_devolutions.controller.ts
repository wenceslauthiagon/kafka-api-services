import { Logger } from 'winston';
import {
  AutoValidator,
  buildQueryString,
  ForbiddenException,
} from '@zro/common';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { IsArray, IsObject } from 'class-validator';
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

type TGetDevolutionsRequest = TFiltersRequest;

export class GetDevolutionsRequest
  extends FiltersRequest
  implements TGetDevolutionsRequest
{
  constructor(props: TGetDevolutionsRequest) {
    super(props);
  }
}

export type TGetDevolutionsResponseItem = TTransactionResponseItem;

export type TGetDevolutionsResponse = {
  data: TGetDevolutionsResponseItem[];
  links: TLinks;
  meta: TMeta;
};

export class GetDevolutionsResponseItem
  extends TransactionResponseItem
  implements TGetDevolutionsResponseItem
{
  constructor(props: TGetDevolutionsResponseItem) {
    super(props);
  }
}

export class GetDevolutionsResponse
  extends AutoValidator
  implements TGetDevolutionsResponse
{
  @IsArray()
  data: TGetDevolutionsResponseItem[];

  @IsObject()
  links: TLinks;

  @IsObject()
  meta: TMeta;

  constructor(props: TGetDevolutionsResponse) {
    super(props);
    this.data = props.data.map((item) => new GetDevolutionsResponseItem(item));
  }
}

export class GetDevolutionsController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetDevolutionsController.name,
    });
  }

  async execute(
    request: GetDevolutionsRequest,
  ): Promise<GetDevolutionsResponse> {
    this.logger.debug('Get devolutions request.', { request });

    Reflect.deleteProperty(request, 'wallet_id');

    try {
      const result = await this.axiosInstance.get<GetDevolutionsResponse>(
        buildQueryString(PAYMENTS_GATEWAY_SERVICES.DEVOLUTION, request),
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new GetDevolutionsResponse(result.data);

      this.logger.info('Get devolutions response.', {
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
