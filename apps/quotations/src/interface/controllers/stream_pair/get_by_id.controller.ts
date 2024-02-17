import { AutoValidator } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { GetStreamPairByIdUseCase } from '@zro/quotations/application';
import { StreamPair, StreamPairRepository } from '@zro/quotations/domain';
import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';

type TGetStreamPairByIdRequest = Pick<StreamPair, 'id'>;

export class GetStreamPairByIdRequest
  extends AutoValidator
  implements TGetStreamPairByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetStreamPairByIdRequest) {
    super(props);
  }
}

type TGetStreamPairByIdResponse = Omit<StreamPair, 'isSynthetic'>;

export class GetStreamPairByIdResponse
  extends AutoValidator
  implements TGetStreamPairByIdResponse
{
  @IsUUID(4)
  id?: string;

  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  quoteCurrency: Currency;

  @IsInt()
  priority: number;

  @IsString()
  gatewayName: string;

  @IsBoolean()
  active: boolean;

  @IsOptional()
  composedBy?: StreamPair[];

  constructor(props: TGetStreamPairByIdResponse) {
    super(props);
  }
}

export class GetStreamPairByIdController {
  private usecase: GetStreamPairByIdUseCase;

  constructor(
    private logger: Logger,
    private readonly streamPairRepository: StreamPairRepository,
  ) {
    this.logger = logger.child({
      context: GetStreamPairByIdController.name,
    });
    this.usecase = new GetStreamPairByIdUseCase(
      this.logger,
      this.streamPairRepository,
    );
  }

  async execute(
    request: GetStreamPairByIdRequest,
  ): Promise<GetStreamPairByIdResponse> {
    this.logger.debug('Create streamQuotation request.');

    const { id } = request;

    const response = await this.usecase.execute(id);

    if (!response) return null;

    return new GetStreamPairByIdResponse({
      id: response.id,
      baseCurrency: response.baseCurrency,
      quoteCurrency: response.quoteCurrency,
      priority: response.priority,
      gatewayName: response.gatewayName,
      active: response.active,
      composedBy: response.composedBy,
    });
  }
}
