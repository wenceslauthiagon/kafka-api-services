import { Logger } from 'winston';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  IsEmail,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  MaxValue,
  SanitizeHtml,
} from '@zro/common';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import { PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  CreateQrCodeDynamicUseCase as UseCase,
  PixKeyService,
  UserService,
} from '@zro/pix-payments/application';
import {
  QrCodeDynamicEventEmitterController,
  QrCodeDynamicEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TCreateQrCodeDynamicInstantBillingRequest = Pick<
  QrCodeDynamic,
  | 'id'
  | 'documentValue'
  | 'allowUpdate'
  | 'summary'
  | 'description'
  | 'expirationDate'
  | 'payerRequest'
> & { userId: UserId; key: PixKey['key'] };

export class CreateQrCodeDynamicInstantBillingRequest
  extends AutoValidator
  implements TCreateQrCodeDynamicInstantBillingRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  documentValue: number;

  @IsBoolean()
  @IsOptional()
  allowUpdate?: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  summary?: string;

  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  payerRequest?: string;

  constructor(props: TCreateQrCodeDynamicInstantBillingRequest) {
    super(props);
  }
}

type TCreateQrCodeDynamicInstantBillingResponse = Pick<
  QrCodeDynamic,
  | 'id'
  | 'documentValue'
  | 'summary'
  | 'expirationDate'
  | 'description'
  | 'payerName'
  | 'payerPersonType'
  | 'payerDocument'
  | 'payerEmail'
  | 'payerCity'
  | 'payerPhone'
  | 'payerAddress'
  | 'payerRequest'
  | 'state'
  | 'createdAt'
> & { keyId: PixKeyId };

export class CreateQrCodeDynamicInstantBillingResponse
  extends AutoValidator
  implements TCreateQrCodeDynamicInstantBillingResponse
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  keyId!: PixKeyId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  @IsInt()
  @IsPositive()
  documentValue: number;

  @IsString()
  @IsOptional()
  @SanitizeHtml()
  @MaxLength(140)
  summary?: string;

  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  payerName?: string;

  @IsOptional()
  @IsEnum(PersonType)
  payerPersonType?: PersonType;

  @IsOptional()
  @IsString()
  payerDocument?: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @IsOptional()
  @IsString()
  payerCity?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  payerAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  payerRequest?: string;

  @IsEnum(PixQrCodeDynamicState)
  state: PixQrCodeDynamicState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateQrCodeDynamicInstantBillingResponse) {
    super(props);
  }
}

export class CreateQrCodeDynamicInstantBillingController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeDynamicRepository,
    userService: UserService,
    pixKeyService: PixKeyService,
    eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateQrCodeDynamicInstantBillingController.name,
    });

    const controllerEventEmitter = new QrCodeDynamicEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      userService,
      pixKeyService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: CreateQrCodeDynamicInstantBillingRequest,
  ): Promise<CreateQrCodeDynamicInstantBillingResponse> {
    this.logger.debug('Create qrCodeStatic request.', { request });

    const {
      id,
      userId,
      key,
      documentValue,
      allowUpdate,
      expirationDate,
      summary,
      description,
      payerRequest,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const pixKey = new PixKeyEntity({ key });

    const qrCodeDynamic = await this.usecase.execute({
      id,
      user,
      pixKey,
      documentValue,
      expirationDate,
      summary,
      description,
      payerRequest,
      allowUpdate,
    });

    if (!qrCodeDynamic) return null;

    const response = new CreateQrCodeDynamicInstantBillingResponse({
      id: qrCodeDynamic.id,
      keyId: qrCodeDynamic.pixKey.id,
      documentValue: qrCodeDynamic.documentValue,
      expirationDate: qrCodeDynamic.expirationDate,
      summary: qrCodeDynamic.summary,
      description: qrCodeDynamic.description,
      payerName: qrCodeDynamic.payerName,
      payerPersonType: qrCodeDynamic.payerPersonType,
      payerDocument: qrCodeDynamic.payerDocument,
      payerEmail: qrCodeDynamic.payerEmail,
      payerCity: qrCodeDynamic.payerCity,
      payerPhone: qrCodeDynamic.payerPhone,
      payerAddress: qrCodeDynamic.payerAddress,
      payerRequest: qrCodeDynamic.payerRequest,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
    });

    this.logger.info('Create qrCodeDynamic response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
