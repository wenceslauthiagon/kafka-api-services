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
  IsUUID,
  isDefined,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiValueType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentType,
  JdpiFinalityType,
} from '@zro/jdpi/domain';
import {
  NotifyCreditValidationCacheRepository,
  NotifyCreditValidationEntity,
  QrCodeStaticCacheRepository,
} from '@zro/api-jdpi/domain';
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

type THandleNotifyCreditValidationJdpiEventAmountDetails = {
  fareBuyAmount: number;
  valueType: JdpiValueType;
};

export class HandleNotifyCreditValidationJdpiEventAmountDetails
  extends AutoValidator
  implements THandleNotifyCreditValidationJdpiEventAmountDetails
{
  @IsInt()
  @IsPositive()
  fareBuyAmount: number;

  @IsEnum(JdpiValueType)
  valueType: JdpiValueType;
}

export type THandleNotifyCreditValidationJdpiEventRequest = {
  id: string;
  groupId: string;
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
  amountDetails?: THandleNotifyCreditValidationJdpiEventAmountDetails[];
  informationBetweenClients?: string;
  endToEndId?: string;
  clientConciliationId?: string;
  key?: string;
};

export class HandleNotifyCreditValidationJdpiEventRequest
  extends AutoValidator
  implements THandleNotifyCreditValidationJdpiEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  groupId: string;

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
  @Type(() => HandleNotifyCreditValidationJdpiEventAmountDetails)
  @ValidateNested({ each: true })
  amountDetails?: HandleNotifyCreditValidationJdpiEventAmountDetails[];

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

  constructor(props: THandleNotifyCreditValidationJdpiEventRequest) {
    super(
      Object.assign({}, props, {
        amountDetails:
          props.amountDetails &&
          props.amountDetails.map(
            (amountDetail) =>
              new HandleNotifyCreditValidationJdpiEventAmountDetails(
                amountDetail,
              ),
          ),
      }),
    );
  }
}

export class HandleNotifyCreditValidationEventController {
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
      context: HandleNotifyCreditValidationEventController.name,
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
    request: HandleNotifyCreditValidationJdpiEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle notify credit validation request.', {
      request,
    });

    const notifyCreditValidation = new NotifyCreditValidationEntity({
      id: request.id,
      groupId: request.groupId,
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
      thirdPartIspb: request.thirdPartIspb,
      thirdPartPersonType: Parse.getPersonType(request.thirdPartPersonType),
      thirdPartDocument: request.thirdPartDocument,
      thirdPartName: request.thirdPartName,
      ...(request.thirdPartBranch && {
        thirdPartBranch: request.thirdPartBranch,
      }),
      thirdPartAccountType: Parse.getAccountType(request.thirdPartAccountType),
      thirdPartAccountNumber: request.thirdPartAccountNumber,
      clientIspb: request.clientIspb,
      clientPersonType: Parse.getPersonType(request.clientPersonType),
      clientDocument: request.clientDocument,
      ...(request.clientBranch && { clientBranch: request.clientBranch }),
      clientAccountType: Parse.getAccountType(request.clientAccountType),
      clientAccountNumber: request.clientAccountNumber,
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
    });

    await this.usecase.execute(notifyCreditValidation);
  }
}
