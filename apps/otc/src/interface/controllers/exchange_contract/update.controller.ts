import { Logger } from 'winston';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { UpdateExchangeContractUseCase } from '@zro/otc/application';

type TUpdateExchangeContractRequest = Pick<
  ExchangeContract,
  'id' | 'contractNumber' | 'vetQuote'
>;

export class UpdateExchangeContractRequest
  extends AutoValidator
  implements TUpdateExchangeContractRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  contractNumber: string;

  @IsNumber()
  vetQuote: number;

  constructor(props: TUpdateExchangeContractRequest) {
    super(props);
  }
}

type TUpdateExchangeContractResponse = Pick<
  ExchangeContract,
  | 'id'
  | 'contractQuote'
  | 'vetQuote'
  | 'contractNumber'
  | 'totalAmount'
  | 'createdAt'
>;

export class UpdateExchangeContractResponse
  extends AutoValidator
  implements TUpdateExchangeContractResponse
{
  @IsUUID(4)
  id: string;

  @IsNumber()
  contractQuote: number;

  @IsNumber()
  vetQuote: number;

  @IsString()
  contractNumber: string;

  @IsNumber()
  totalAmount: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TUpdateExchangeContractResponse) {
    super(props);
  }
}
export class UpdateExchangeContractController {
  private usecase: UpdateExchangeContractUseCase;

  constructor(
    private logger: Logger,
    exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: UpdateExchangeContractController.name,
    });
    this.usecase = new UpdateExchangeContractUseCase(
      logger,
      exchangeContractRepository,
    );
  }

  async execute(
    request: UpdateExchangeContractRequest,
  ): Promise<UpdateExchangeContractResponse> {
    this.logger.debug('Updating exchangeContract props.', { request });

    const { id, contractNumber, vetQuote } = request;

    const updatedExchangeContract = await this.usecase.execute(id, {
      contractNumber,
      vetQuote,
    });

    const response = new UpdateExchangeContractResponse({
      id: updatedExchangeContract.id,
      contractQuote: updatedExchangeContract.contractQuote,
      vetQuote: updatedExchangeContract.vetQuote,
      contractNumber: updatedExchangeContract.contractNumber,
      totalAmount: updatedExchangeContract.totalAmount,
      createdAt: updatedExchangeContract.createdAt,
    });

    this.logger.info('Update Exnchange Contract response.', {
      updateExchangeContract: response,
    });

    return response;
  }
}
