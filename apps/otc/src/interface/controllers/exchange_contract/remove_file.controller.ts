import { Logger } from 'winston';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { RemoveExchangeContractFileUseCase } from '@zro/otc/application';
import { FileEntity } from '@zro/storage/domain';

type TRemoveExchangeContractFileRequest = {
  fileId: string;
};

export class RemoveExchangeContractFileRequest
  extends AutoValidator
  implements TRemoveExchangeContractFileRequest
{
  @IsUUID(4)
  fileId: string;

  constructor(props: TRemoveExchangeContractFileRequest) {
    super(props);
  }
}

type TRemoveExchangeContractFileResponse = Pick<
  ExchangeContract,
  | 'id'
  | 'contractQuote'
  | 'vetQuote'
  | 'contractNumber'
  | 'totalAmount'
  | 'createdAt'
>;

export class RemoveExchangeContractFileResponse
  extends AutoValidator
  implements TRemoveExchangeContractFileResponse
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

  constructor(props: TRemoveExchangeContractFileResponse) {
    super(props);
  }
}

export class RemoveExchangeContractFileController {
  private usecase: RemoveExchangeContractFileUseCase;

  constructor(
    private logger: Logger,
    exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: RemoveExchangeContractFileController.name,
    });
    this.usecase = new RemoveExchangeContractFileUseCase(
      logger,
      exchangeContractRepository,
    );
  }

  async execute(
    request: RemoveExchangeContractFileRequest,
  ): Promise<RemoveExchangeContractFileResponse> {
    this.logger.debug('Remove exchange contract file.', { request });

    const { fileId } = request;

    const file = new FileEntity({
      id: fileId,
    });

    const updatedExchangeContract = await this.usecase.execute(file);

    if (!updatedExchangeContract) return null;

    const response = new RemoveExchangeContractFileResponse({
      id: updatedExchangeContract.id,
      contractQuote: updatedExchangeContract.contractQuote,
      vetQuote: updatedExchangeContract.vetQuote,
      contractNumber: updatedExchangeContract.contractNumber,
      totalAmount: updatedExchangeContract.totalAmount,
      createdAt: updatedExchangeContract.createdAt,
    });

    this.logger.info('Remove exchange contract file response.', {
      removeExchangeContractFile: response,
    });

    return response;
  }
}
