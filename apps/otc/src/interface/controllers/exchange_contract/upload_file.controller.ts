import { Logger } from 'winston';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { FileEntity } from '@zro/storage/domain';
import { UploadExchangeContractFileUseCase } from '@zro/otc/application';

type TUploadExchangeContractFileRequest = Pick<ExchangeContract, 'id' | 'file'>;

export class UploadExchangeContractFileRequest
  extends AutoValidator
  implements TUploadExchangeContractFileRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  fileId: string;

  constructor(props: TUploadExchangeContractFileRequest) {
    super(props);
  }
}

type TUploadExchangeContractFileResponse = Pick<
  ExchangeContract,
  | 'id'
  | 'contractQuote'
  | 'vetQuote'
  | 'contractNumber'
  | 'totalAmount'
  | 'createdAt'
> & { fileId: ExchangeContract['file']['id'] };

export class UploadExchangeContractFileResponse
  extends AutoValidator
  implements TUploadExchangeContractFileResponse
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

  @IsString()
  fileId: ExchangeContract['file']['id'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TUploadExchangeContractFileResponse) {
    super(props);
  }
}

export class UploadExchangeContractFileController {
  private usecase: UploadExchangeContractFileUseCase;

  constructor(
    private logger: Logger,
    exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: UploadExchangeContractFileController.name,
    });
    this.usecase = new UploadExchangeContractFileUseCase(
      logger,
      exchangeContractRepository,
    );
  }

  async execute(
    request: UploadExchangeContractFileRequest,
  ): Promise<UploadExchangeContractFileResponse> {
    this.logger.debug('Upload exchange contract file.', { request });

    const { id, fileId } = request;

    const file = new FileEntity({ id: fileId });

    const updatedExchangeContract = await this.usecase.execute(id, file);

    if (!updatedExchangeContract) return null;

    const response = new UploadExchangeContractFileResponse({
      id: updatedExchangeContract.id,
      contractQuote: updatedExchangeContract.contractQuote,
      vetQuote: updatedExchangeContract.vetQuote,
      contractNumber: updatedExchangeContract.contractNumber,
      totalAmount: updatedExchangeContract.totalAmount,
      fileId: updatedExchangeContract.file.id,
      createdAt: updatedExchangeContract.createdAt,
    });

    this.logger.info('Update exchange contract file response.', {
      uploadExchangeContractFile: response,
    });

    return response;
  }
}
