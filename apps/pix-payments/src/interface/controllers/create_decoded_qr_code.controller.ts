import { Logger } from 'winston';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedQrCode,
  DecodedQrCodeAdditionalInfo,
  DecodedQrCodeRepository,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PaymentType,
  PixAgentMod,
} from '@zro/pix-payments/domain';
import {
  BankingService,
  CreateDecodedQrCodeUseCase as UseCase,
  PixPaymentGateway,
  UserService,
} from '@zro/pix-payments/application';
import {
  DecodeQrCodeEventEmitterController,
  DecodeQrCodeEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type TCreateDecodedQrCodeRequest = Pick<
  DecodedQrCode,
  'id' | 'emv' | 'paymentDate'
> & { userId: UserId };

export class CreateDecodedQrCodeRequest
  extends AutoValidator
  implements TCreateDecodedQrCodeRequest
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: UserId;

  @IsString()
  emv!: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  constructor(props: TCreateDecodedQrCodeRequest) {
    super(props);
  }
}

type TCreateDecodedQrCodeResponse = Pick<
  DecodedQrCode,
  | 'id'
  | 'emv'
  | 'document'
  | 'cityCode'
  | 'paymentDate'
  | 'key'
  | 'txId'
  | 'documentValue'
  | 'additionalInfo'
  | 'recipientName'
  | 'recipientPersonType'
  | 'recipientDocument'
  | 'recipientIspb'
  | 'recipientBranch'
  | 'recipientAccountType'
  | 'recipientAccountNumber'
  | 'recipientCity'
  | 'endToEndId'
  | 'type'
  | 'allowUpdate'
  | 'paymentValue'
  | 'pss'
  | 'expirationDate'
  | 'payerPersonType'
  | 'payerDocument'
  | 'payerName'
  | 'status'
  | 'version'
  | 'additionalInfos'
  | 'withdrawValue'
  | 'changeValue'
  | 'dueDate'
  | 'interestValue'
  | 'fineValue'
  | 'deductionValue'
  | 'discountValue'
  | 'state'
  | 'createdAt'
  | 'agentIspbWithdrawal'
  | 'agentModWithdrawal'
  | 'agentIspbChange'
  | 'agentModChange'
> & { paymentType: PaymentType };

export class CreateDecodedQrCodeResponse
  extends AutoValidator
  implements TCreateDecodedQrCodeResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  emv: string;

  @IsString()
  @Length(11, 14)
  document: string;

  @IsString()
  @IsOptional()
  @Length(7, 7)
  cityCode?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsString()
  @MaxLength(255)
  txId: string;

  @IsInt()
  @Min(0)
  documentValue: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  additionalInfo?: string;

  @IsString()
  @MaxLength(255)
  recipientName: string;

  @IsEnum(PersonType)
  recipientPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  recipientDocument: string;

  @IsString()
  @Length(8, 8)
  recipientIspb: string;

  @IsString()
  @Length(4, 4)
  recipientBranch: string;

  @IsEnum(AccountType)
  recipientAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  recipientAccountNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipientCity: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsEnum(DecodedQrCodeType)
  type: DecodedQrCodeType;

  @IsBoolean()
  allowUpdate: boolean;

  @IsInt()
  @Min(0)
  paymentValue: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  pss?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  expirationDate?: Date;

  @IsOptional()
  @IsEnum(PersonType)
  payerPersonType?: PersonType;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  payerDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  payerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  version?: string;

  @IsArray()
  @IsOptional()
  additionalInfos?: DecodedQrCodeAdditionalInfo[];

  @IsInt()
  @IsPositive()
  @IsOptional()
  withdrawValue?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  changeValue?: number;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format dueDate',
  })
  dueDate?: Date;

  @IsInt()
  @Min(0)
  @IsOptional()
  interestValue?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  fineValue?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  deductionValue?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @IsEnum(DecodedQrCodeState)
  state: DecodedQrCodeState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsString()
  @Length(8, 8)
  @IsOptional()
  agentIspbWithdrawal?: string;

  @IsEnum(PixAgentMod)
  @IsOptional()
  agentModWithdrawal?: PixAgentMod;

  @IsString()
  @Length(8, 8)
  @IsOptional()
  agentIspbChange?: string;

  @IsEnum(PixAgentMod)
  @IsOptional()
  agentModChange?: PixAgentMod;

  constructor(props: TCreateDecodedQrCodeResponse) {
    super(props);
  }
}

export class CreateDecodedQrCodeController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    decodedQrCodeRepository: DecodedQrCodeRepository,
    eventEmitter: DecodeQrCodeEventEmitterControllerInterface,
    pixPaymentGateway: PixPaymentGateway,
    userService: UserService,
    bankingService: BankingService,
  ) {
    this.logger = logger.child({ context: CreateDecodedQrCodeController.name });

    const controllerEventEmitter = new DecodeQrCodeEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      decodedQrCodeRepository,
      controllerEventEmitter,
      pixPaymentGateway,
      userService,
      bankingService,
    );
  }

  async execute(
    request: CreateDecodedQrCodeRequest,
  ): Promise<CreateDecodedQrCodeResponse> {
    this.logger.debug('Create decoded QR code request.', { request });

    const { id, userId, emv, paymentDate } = request;

    const user = new UserEntity({ uuid: userId });

    const decodedQrCode = await this.usecase.execute(
      id,
      user,
      emv,
      paymentDate,
    );

    if (!decodedQrCode) return null;

    const response = new CreateDecodedQrCodeResponse({
      id: decodedQrCode.id,
      emv: decodedQrCode.emv,
      document: decodedQrCode.document,
      cityCode: decodedQrCode.cityCode,
      paymentDate: decodedQrCode.paymentDate,
      key: decodedQrCode.key,
      txId: decodedQrCode.txId,
      documentValue: decodedQrCode.documentValue,
      additionalInfo: decodedQrCode.additionalInfo,
      recipientName: decodedQrCode.recipientName,
      recipientPersonType: decodedQrCode.recipientPersonType,
      recipientDocument: decodedQrCode.recipientDocument,
      recipientIspb: decodedQrCode.recipientIspb,
      recipientBranch: decodedQrCode.recipientBranch,
      recipientAccountType: decodedQrCode.recipientAccountType,
      recipientAccountNumber: decodedQrCode.recipientAccountNumber,
      recipientCity: decodedQrCode.recipientCity,
      endToEndId: decodedQrCode.endToEndId,
      type: decodedQrCode.type,
      allowUpdate: decodedQrCode.allowUpdate,
      paymentValue: decodedQrCode.paymentValue,
      pss: decodedQrCode.pss,
      expirationDate: decodedQrCode.expirationDate,
      payerPersonType: decodedQrCode.payerPersonType,
      payerDocument: decodedQrCode.payerDocument,
      payerName: decodedQrCode.payerName,
      status: decodedQrCode.status,
      version: decodedQrCode.version,
      additionalInfos: decodedQrCode.additionalInfos,
      withdrawValue: decodedQrCode.withdrawValue,
      changeValue: decodedQrCode.changeValue,
      dueDate: decodedQrCode.dueDate,
      interestValue: decodedQrCode.interestValue,
      fineValue: decodedQrCode.fineValue,
      deductionValue: decodedQrCode.deductionValue,
      discountValue: decodedQrCode.discountValue,
      state: decodedQrCode.state,
      createdAt: decodedQrCode.createdAt,
      paymentType: PaymentType.QR_CODE,
      agentIspbWithdrawal: decodedQrCode.agentIspbWithdrawal,
      agentModWithdrawal: decodedQrCode.agentModWithdrawal,
    });

    this.logger.info('Create decoded QR code response.', {
      decodedQrCode: response,
    });

    return response;
  }
}
