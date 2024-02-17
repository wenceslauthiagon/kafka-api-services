import { Logger } from 'winston';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsEmail,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  MaxValue,
  SanitizeHtml,
} from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
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

type TCreateQrCodeDynamicDueDateRequest = Pick<
  QrCodeDynamic,
  | 'id'
  | 'documentValue'
  | 'allowUpdate'
  | 'allowUpdateChange'
  | 'allowUpdateWithdrawal'
  | 'summary'
  | 'description'
  | 'expirationDate'
  | 'dueDate'
  | 'payerName'
  | 'payerPersonType'
  | 'payerDocument'
  | 'payerEmail'
  | 'payerCity'
  | 'payerPhone'
  | 'payerAddress'
  | 'payerRequest'
> & { userId: UserId; key: PixKey['key'] };

export class CreateQrCodeDynamicDueDateRequest
  extends AutoValidator
  implements TCreateQrCodeDynamicDueDateRequest
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

  @IsBoolean()
  @IsOptional()
  allowUpdateChange?: boolean;

  @IsBoolean()
  @IsOptional()
  allowUpdateWithdrawal?: boolean;

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

  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format dueDate',
  })
  dueDate: Date;

  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @IsOptional()
  @IsString()
  payerCity?: string;

  @IsString()
  payerName: string;

  @IsEnum(PersonType)
  payerPersonType: PersonType;

  @IsString()
  payerDocument: string;

  @IsOptional()
  @IsString()
  payerAddress?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  payerRequest?: string;

  constructor(props: TCreateQrCodeDynamicDueDateRequest) {
    super(props);
  }
}

type TCreateQrCodeDynamicDueDateResponse = Pick<
  QrCodeDynamic,
  | 'id'
  | 'summary'
  | 'expirationDate'
  | 'description'
  | 'dueDate'
  | 'state'
  | 'createdAt'
> & { keyId: PixKeyId };

export class CreateQrCodeDynamicDueDateResponse
  extends AutoValidator
  implements TCreateQrCodeDynamicDueDateResponse
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

  @IsString()
  @IsOptional()
  @SanitizeHtml()
  @MaxLength(140)
  summary?: string;

  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format dueDate',
  })
  dueDate: Date;

  @IsEnum(PixQrCodeDynamicState)
  state: PixQrCodeDynamicState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateQrCodeDynamicDueDateResponse) {
    super(props);
  }
}

export class CreateQrCodeDynamicDueDateController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeDynamicDueDateRepository: QrCodeDynamicRepository,
    userService: UserService,
    pixKeyService: PixKeyService,
    eventEmitterDueDate: QrCodeDynamicEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateQrCodeDynamicDueDateController.name,
    });

    const controllerEventEmitter = new QrCodeDynamicEventEmitterController(
      eventEmitterDueDate,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeDynamicDueDateRepository,
      userService,
      pixKeyService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: CreateQrCodeDynamicDueDateRequest,
  ): Promise<CreateQrCodeDynamicDueDateResponse> {
    this.logger.debug('Create qrCodeStaticDueDate request.', { request });

    const {
      id,
      userId,
      key,
      documentValue,
      dueDate,
      allowUpdate,
      allowUpdateChange,
      allowUpdateWithdrawal,
      expirationDate,
      summary,
      description,
      payerEmail,
      payerCity,
      payerPersonType,
      payerDocument,
      payerAddress,
      payerPhone,
      payerName,
      payerRequest,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const pixKey = new PixKeyEntity({ key });

    const qrCodeDynamic = await this.usecase.execute({
      id,
      user,
      pixKey,
      documentValue,
      dueDate,
      allowUpdate,
      allowUpdateChange,
      allowUpdateWithdrawal,
      expirationDate,
      summary,
      description,
      payerEmail,
      payerCity,
      payerPersonType,
      payerDocument,
      payerAddress,
      payerPhone,
      payerName,
      payerRequest,
    });

    if (!qrCodeDynamic) return null;

    const response = new CreateQrCodeDynamicDueDateResponse({
      id: qrCodeDynamic.id,
      keyId: qrCodeDynamic.pixKey.id,
      expirationDate: qrCodeDynamic.expirationDate,
      summary: qrCodeDynamic.summary,
      description: qrCodeDynamic.description,
      dueDate: qrCodeDynamic.dueDate,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
    });

    this.logger.info('Create qrCodeDynamicDueDate response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
