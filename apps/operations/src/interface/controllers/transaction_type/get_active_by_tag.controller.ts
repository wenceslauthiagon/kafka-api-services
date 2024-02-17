import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  TransactionType,
  TransactionTypeParticipants,
  TransactionTypeRepository,
  TransactionTypeState,
} from '@zro/operations/domain';
import { GetActiveTransactionTypeByTagUseCase as UseCase } from '@zro/operations/application';
import { IsEnum, IsInt, IsPositive, IsString, Length } from 'class-validator';

export type TGetActiveTransactionTypeByTagRequest = Pick<
  TransactionType,
  'tag'
>;

export class GetActiveTransactionTypeByTagRequest
  extends AutoValidator
  implements TGetActiveTransactionTypeByTagRequest
{
  @IsString()
  @Length(1, 255)
  tag: string;

  constructor(props: TGetActiveTransactionTypeByTagRequest) {
    super(props);
  }
}

export type TGetActiveTransactionTypeByTagResponse = Pick<
  TransactionType,
  'id' | 'tag' | 'state' | 'title' | 'participants'
>;

export class GetActiveTransactionTypeByTagResponse
  extends AutoValidator
  implements TGetActiveTransactionTypeByTagResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsString()
  @Length(1, 255)
  tag: string;

  @IsEnum(TransactionTypeState)
  state: TransactionTypeState;

  @IsString()
  @Length(1, 255)
  title: string;

  @IsEnum(TransactionTypeParticipants)
  participants: TransactionTypeParticipants;

  constructor(props: TGetActiveTransactionTypeByTagResponse) {
    super(props);
  }
}

export class GetActiveTransactionTypeByTagController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    transactionTypeRepository: TransactionTypeRepository,
  ) {
    this.logger = logger.child({
      context: GetActiveTransactionTypeByTagController.name,
    });

    this.usecase = new UseCase(this.logger, transactionTypeRepository);
  }

  async execute(
    request: GetActiveTransactionTypeByTagRequest,
  ): Promise<GetActiveTransactionTypeByTagResponse> {
    this.logger.debug('Get transaction type by tag.', { request });

    const result = await this.usecase.execute(request.tag);

    const response =
      result &&
      new GetActiveTransactionTypeByTagResponse({
        id: result.id,
        tag: result.tag,
        title: result.title,
        state: result.state,
        participants: result.participants,
      });

    this.logger.debug('Get transaction type by tag response.', { response });

    return response;
  }
}
