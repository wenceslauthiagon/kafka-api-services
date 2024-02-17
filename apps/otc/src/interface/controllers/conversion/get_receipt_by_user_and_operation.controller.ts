import { Logger } from 'winston';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { ConversionReceipt, ConversionRepository } from '@zro/otc/domain';
import { GetConversionReceiptByUserAndOperationUseCase as UseCase } from '@zro/otc/application';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  PaymentData,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';

type OperationId = Operation['id'];
type UserId = User['uuid'];
type CurrencyId = Currency['id'];
type CurrencyTitle = Currency['title'];
type CurrencySymbol = Currency['symbol'];
type CurrencyTag = Currency['tag'];
type CurrencyDecimal = Currency['decimal'];

type TGetConversionReceiptByUserAndOperationRequest = {
  userId: UserId;
  operationId: OperationId;
  currencyId: CurrencyId;
  currencyTitle: CurrencyTitle;
  currencySymbol: CurrencySymbol;
  currencyTag: CurrencyTag;
  currencyDecimal: CurrencyDecimal;
};

export class GetConversionReceiptByUserAndOperationRequest
  extends AutoValidator
  implements TGetConversionReceiptByUserAndOperationRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  operationId: string;

  @IsPositive()
  currencyId: CurrencyId;

  @IsString()
  @Length(1, 255)
  currencyTitle: CurrencyTitle;

  @IsString()
  @Length(1, 255)
  currencySymbol: CurrencySymbol;

  @IsString()
  @Length(1, 255)
  currencyTag: CurrencyTag;

  @IsInt()
  @Min(0)
  currencyDecimal: CurrencyDecimal;

  constructor(props: TGetConversionReceiptByUserAndOperationRequest) {
    super(props);
  }
}

type TGetConversionReceiptByUserAndOperationResponse = ConversionReceipt;

export class GetConversionReceiptByUserAndOperationResponse
  extends AutoValidator
  implements TGetConversionReceiptByUserAndOperationResponse
{
  @IsArray()
  @IsNotEmpty()
  paymentData!: PaymentData;

  @IsUUID(4)
  operationId!: OperationId;

  @IsString()
  @IsNotEmpty()
  paymentTitle!: string;

  @IsBoolean()
  isScheduled!: boolean;

  @IsBoolean()
  activeDevolution!: boolean;

  constructor(props: TGetConversionReceiptByUserAndOperationResponse) {
    super(props);
  }
}

export class GetConversionReceiptByUserAndOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
  ) {
    this.logger = logger.child({
      context: GetConversionReceiptByUserAndOperationController.name,
    });

    this.usecase = new UseCase(this.logger, conversionRepository);
  }

  async execute(
    request: GetConversionReceiptByUserAndOperationRequest,
  ): Promise<GetConversionReceiptByUserAndOperationResponse> {
    this.logger.debug('Getting conversion by id request.', { request });

    const {
      userId,
      operationId,
      currencyId,
      currencySymbol,
      currencyTag,
      currencyTitle,
      currencyDecimal,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const operation = new OperationEntity({ id: operationId });
    const currency = new CurrencyEntity({
      id: currencyId,
      title: currencyTitle,
      tag: currencyTag,
      symbol: currencySymbol,
      decimal: currencyDecimal,
    });

    const receipt = await this.usecase.execute(user, operation, currency);

    const response =
      receipt &&
      new GetConversionReceiptByUserAndOperationResponse({
        paymentData: receipt.paymentData,
        paymentTitle: receipt.paymentTitle,
        operationId: receipt.operationId,
        isScheduled: receipt.isScheduled,
        activeDevolution: receipt.activeDevolution,
      });

    this.logger.info('Getting conversion receipt.', {
      receipt: response,
    });

    return response;
  }
}
