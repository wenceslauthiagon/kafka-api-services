import { Logger } from 'winston';
import { Type } from 'class-transformer';
import {
  IsString,
  MaxLength,
  Length,
  IsEnum,
  IsInt,
  IsPositive,
  IsArray,
  IsOptional,
  ValidateNested,
  isDefined,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { PixDevolutionCode } from '@zro/pix-payments/domain';
import {
  NotifyCreditValidationCacheRepository,
  NotifyCreditValidationEntity,
  QrCodeStaticCacheRepository,
  ResultType,
} from '@zro/api-jdpi/domain';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiValueType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentType,
  JdpiFinalityType,
  JdpiErrorCode,
} from '@zro/jdpi/domain';
import {
  PixPaymentService,
  CreateNotifyCreditValidationUseCase as UseCase,
  UserService,
} from '@zro/api-jdpi/application';
import {
  NotifyCreditValidationEventEmitterController,
  NotifyCreditValidationEventEmitterControllerInterface,
  Parse,
} from '@zro/api-jdpi/interface';

type TNotifyCreditValidationAmountDetails = {
  fareBuyAmount: number;
  valueType: JdpiValueType;
};

export class NotifyCreditValidationAmountDetails
  extends AutoValidator
  implements TNotifyCreditValidationAmountDetails
{
  @IsInt()
  @IsPositive()
  fareBuyAmount: number;

  @IsEnum(JdpiValueType)
  valueType: JdpiValueType;
}

type TNotifyCreditValidationRequest = {
  id: string;
  initiationType: JdpiPaymentType;
  paymentPriorityType: JdpiPaymentPriorityType;
  paymentPriorityLevelType: JdpiPaymentPriorityLevelType;
  finalityType: JdpiFinalityType;
  agentModalityType?: JdpiAgentModalityType;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  thirdPartIspb: string;
  thirdPartPersonType: JdpiPersonType;
  thirdPartDocument: string;
  thirdPartName: string;
  thirdPartBranch?: string;
  thirdPartAccountType: JdpiAccountType;
  thirdPartAccountNumber: string;
  clientIspb: string;
  clientPersonType: JdpiPersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: JdpiAccountType;
  clientAccountNumber: string;
  amount: number;
  amountDetails?: TNotifyCreditValidationAmountDetails[];
  informationBetweenClients?: string;
  endToEndId?: string;
  clientConciliationId?: string;
  key?: string;
  originalEndToEndId?: string;
  devolutionEndToEndId?: string;
  devolutionCode?: PixDevolutionCode;
  devolutionReason?: string;
};

export class NotifyCreditValidationRequest
  extends AutoValidator
  implements TNotifyCreditValidationRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(JdpiPaymentType)
  initiationType: JdpiPaymentType;

  @IsEnum(JdpiPaymentPriorityType)
  paymentPriorityType: JdpiPaymentPriorityType;

  @IsEnum(JdpiPaymentPriorityLevelType)
  paymentPriorityLevelType: JdpiPaymentPriorityLevelType;

  @IsEnum(JdpiFinalityType)
  finalityType: JdpiFinalityType;

  @IsEnum(JdpiAgentModalityType)
  @IsOptional()
  agentModalityType?: JdpiAgentModalityType;

  @IsString()
  @IsOptional()
  ispbPss?: string;

  @IsString()
  @Length(14)
  @IsOptional()
  paymentInitiatorDocument?: string;

  @IsString()
  thirdPartIspb: string;

  @IsEnum(JdpiPersonType)
  thirdPartPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  thirdPartName: string;

  @IsString()
  @IsOptional()
  thirdPartBranch?: string;

  @IsEnum(JdpiAccountType)
  thirdPartAccountType: JdpiAccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  clientIspb: string;

  @IsEnum(JdpiPersonType)
  clientPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @IsOptional()
  clientBranch?: string;

  @IsEnum(JdpiAccountType)
  clientAccountType: JdpiAccountType;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsArray()
  @IsOptional()
  @Type(() => NotifyCreditValidationAmountDetails)
  @ValidateNested({ each: true })
  amountDetails?: NotifyCreditValidationAmountDetails[];

  @IsString()
  @IsOptional()
  informationBetweenClients?: string;

  @IsString()
  @IsOptional()
  endToEndId?: string;

  @IsString()
  @IsOptional()
  clientConciliationId?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  originalEndToEndId?: string;

  @IsString()
  @IsOptional()
  devolutionEndToEndId?: string;

  @IsEnum(PixDevolutionCode)
  @IsOptional()
  devolutionCode?: PixDevolutionCode;

  @IsString()
  @IsOptional()
  devolutionReason?: string;

  constructor(props: TNotifyCreditValidationRequest) {
    super(props);
  }
}

type TNotifyCreditValidationResponse = {
  resultType: ResultType;
  devolutionCode?: JdpiErrorCode;
  description?: string;
  createdAt: Date;
};

export class NotifyCreditValidationResponse
  extends AutoValidator
  implements TNotifyCreditValidationResponse
{
  @IsEnum(ResultType)
  resultType: ResultType;

  @IsEnum(JdpiErrorCode)
  @IsOptional()
  devolutionCode?: JdpiErrorCode;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TNotifyCreditValidationResponse) {
    super(props);
  }
}

export class NotifyCreditValidationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    notifyCreditValidationCacheRepository: NotifyCreditValidationCacheRepository,
    qrCodeStaticCacheRepository: QrCodeStaticCacheRepository,
    eventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
    userService: UserService,
    pixPaymentService: PixPaymentService,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: NotifyCreditValidationController.name,
    });

    const controllerEventEmitter =
      new NotifyCreditValidationEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyCreditValidationCacheRepository,
      qrCodeStaticCacheRepository,
      controllerEventEmitter,
      userService,
      pixPaymentService,
      ispb,
    );
  }

  async execute(
    request: NotifyCreditValidationRequest,
  ): Promise<NotifyCreditValidationResponse> {
    this.logger.debug('Notify credit validation request.', { request });

    const notifyCreditValidation = new NotifyCreditValidationEntity({
      id: request.id,
      initiationType: Parse.getInitiationType(request.initiationType),
      paymentPriorityType: Parse.getPaymentPriorityType(
        request.paymentPriorityType,
      ),
      paymentPriorityLevelType: Parse.getPaymentPriorityLevelType(
        request.paymentPriorityLevelType,
      ),
      finalityType: request.finalityType,
      ...(isDefined(request.agentModalityType) && {
        agentModalityType: Parse.getAgentMod(request.agentModalityType),
      }),
      ...(isDefined(request.ispbPss) && { ispbPss: request.ispbPss }),
      ...(request.paymentInitiatorDocument && {
        paymentInitiatorDocument: request.paymentInitiatorDocument,
      }),
      amount: request.amount,
      ...(request.amountDetails?.length && {
        amountDetails: request.amountDetails.map((amountDetail) => ({
          fareBuyAmount: amountDetail.fareBuyAmount,
          valueType: Parse.getValueType(amountDetail.valueType),
        })),
      }),
      ...(request.informationBetweenClients && {
        informationBetweenClients: request.informationBetweenClients,
      }),
      ...(request.endToEndId && { endToEndId: request.endToEndId }),
      ...(request.clientConciliationId && {
        clientConciliationId: request.clientConciliationId,
      }),
      ...(request.key && { key: request.key }),
      ...(request.originalEndToEndId && {
        originalEndToEndId: request.originalEndToEndId,
      }),
      ...(request.devolutionEndToEndId && {
        devolutionEndToEndId: request.devolutionEndToEndId,
      }),
      ...(request.devolutionCode && { devolutionCode: request.devolutionCode }),
      ...(request.devolutionReason && {
        devolutionReason: request.devolutionReason,
      }),
    });

    // It is a devolution flow
    if (request.originalEndToEndId) {
      notifyCreditValidation.thirdPartIspb = request.clientIspb;
      notifyCreditValidation.thirdPartPersonType = Parse.getPersonType(
        request.clientPersonType,
      );
      notifyCreditValidation.thirdPartDocument = request.clientDocument;
      notifyCreditValidation.thirdPartName = ''; // FIXME: Turn opcional.
      notifyCreditValidation.thirdPartBranch = request.clientBranch;
      notifyCreditValidation.thirdPartAccountType = Parse.getAccountType(
        request.clientAccountType,
      );
      notifyCreditValidation.thirdPartAccountNumber =
        request.clientAccountNumber;

      notifyCreditValidation.clientIspb = request.thirdPartIspb;
      notifyCreditValidation.clientPersonType = Parse.getPersonType(
        request.thirdPartPersonType,
      );
      notifyCreditValidation.clientDocument = request.thirdPartDocument;
      notifyCreditValidation.clientBranch = request.thirdPartBranch;
      notifyCreditValidation.clientAccountType = Parse.getAccountType(
        request.thirdPartAccountType,
      );
      notifyCreditValidation.clientAccountNumber =
        request.thirdPartAccountNumber;
    } else {
      notifyCreditValidation.thirdPartIspb = request.thirdPartIspb;
      notifyCreditValidation.thirdPartPersonType = Parse.getPersonType(
        request.thirdPartPersonType,
      );
      notifyCreditValidation.thirdPartDocument = request.thirdPartDocument;
      notifyCreditValidation.thirdPartName = request.thirdPartName;
      notifyCreditValidation.thirdPartBranch = request.thirdPartBranch;
      notifyCreditValidation.thirdPartAccountType = Parse.getAccountType(
        request.thirdPartAccountType,
      );
      notifyCreditValidation.thirdPartAccountNumber =
        request.thirdPartAccountNumber;

      notifyCreditValidation.clientIspb = request.clientIspb;
      notifyCreditValidation.clientPersonType = Parse.getPersonType(
        request.clientPersonType,
      );
      notifyCreditValidation.clientDocument = request.clientDocument;
      notifyCreditValidation.clientBranch = request.clientBranch;
      notifyCreditValidation.clientAccountType = Parse.getAccountType(
        request.clientAccountType,
      );
      notifyCreditValidation.clientAccountNumber = request.clientAccountNumber;
    }

    const { response } = await this.usecase.execute(notifyCreditValidation);

    const result = new NotifyCreditValidationResponse({
      resultType: response.resultType,
      devolutionCode: response.devolutionCode,
      description: response.description,
      createdAt: response.createdAt,
    });

    return result;
  }
}
