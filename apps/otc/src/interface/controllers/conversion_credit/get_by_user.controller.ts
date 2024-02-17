import { Logger } from 'winston';
import { IsNumber, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  GetConversionCreditByUserUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc/application';
import { User, UserEntity } from '@zro/users/domain';
import { ConversionCredit } from '@zro/otc/domain';

type UserId = User['uuid'];

export type TGetConversionCreditByUserRequest = {
  userId: UserId;
};

export class GetConversionCreditByUserRequest
  extends AutoValidator
  implements TGetConversionCreditByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetConversionCreditByUserRequest) {
    super(props);
  }
}

type TGetConversionCreditByUserResponse = Pick<
  ConversionCredit,
  'liability' | 'creditBalance'
> & { userId: UserId };

export class GetConversionCreditByUserResponse
  extends AutoValidator
  implements TGetConversionCreditByUserResponse
{
  @IsNumber()
  liability: number;

  @IsNumber()
  creditBalance: number;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetConversionCreditByUserResponse) {
    super(props);
  }
}

export class GetConversionCreditByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationService: OperationService,
    quotationService: QuotationService,
    conversionTransactionTag: string,
    conversionSymbolCurrencyReal: string,
  ) {
    this.logger = logger.child({
      context: GetConversionCreditByUserController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationService,
      quotationService,
      conversionTransactionTag,
      conversionSymbolCurrencyReal,
    );
  }

  async execute(
    request: GetConversionCreditByUserRequest,
  ): Promise<GetConversionCreditByUserResponse> {
    this.logger.debug('Get conversion credit by user request.', { request });

    const { userId } = request;

    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(user);

    if (!result) return null;

    const response = new GetConversionCreditByUserResponse({
      liability: result.liability,
      creditBalance: result.creditBalance,
      userId: result.user?.uuid,
    });

    return response;
  }
}
