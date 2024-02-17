import { Logger } from 'winston';
import {
  IsEnum,
  IsString,
  IsUUID,
  IsPositive,
  IsOptional,
  IsInt,
  IsArray,
  MaxLength,
  Length,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  NotifyCreditDepositEntity,
  NotifyCreditDepositRepository,
} from '@zro/api-jdpi/domain';
import {
  JdpiAccountType,
  JdpiFinalityType,
  JdpiAgentModalityType,
  JdpiPaymentType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiValueType,
} from '@zro/jdpi/domain';
import { HandleFailedNotifyCreditDepositJdpiEventUseCase as UseCase } from '@zro/api-jdpi/application';
import {
  NotifyCreditDepositEventEmitterController,
  NotifyCreditDepositEventEmitterControllerInterface,
  Parse,
} from '@zro/api-jdpi/interface';

type TDetailValue = {
  fareBuyAmount: number;
  valueType: JdpiValueType;
};

export type THandleFailedNotifyCreditDepositJdpiEventRequest = {
  externalId: string;
  endToEndId: string;
  initiationType: JdpiPaymentType;
  paymentPriorityType: JdpiPaymentPriorityType;
  paymentPriorityLevelType: JdpiPaymentPriorityLevelType;
  finalityType: JdpiFinalityType;
  agentModalityType?: JdpiAgentModalityType;
  ispbPss?: string;
  paymentInitiatorDocument?: string;
  clientConciliationId?: string;
  key?: string;
  thirdPartIspb: string;
  thirdPartPersonType: JdpiPersonType;
  thirdPartDocument: string;
  thirdPartBranch?: string;
  thirdPartAccountType: JdpiAccountType;
  thirdPartAccountNumber: string;
  thirdPartName: string;
  clientIspb: string;
  clientPersonType: JdpiPersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: JdpiAccountType;
  clientAccountNumber: string;
  createdAt: Date;
  amount: number;
  amountDetails?: TDetailValue[];
  informationBetweenClients?: string;
};
export class HandleFailedNotifyCreditDepositJdpiEventRequest
  extends AutoValidator
  implements THandleFailedNotifyCreditDepositJdpiEventRequest
{
  @IsUUID(4)
  externalId: string;

  @IsString()
  @MaxLength(255)
  endToEndId: string;

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
  @Length(8, 8)
  ispbPss?: string;

  @IsString()
  @IsOptional()
  @Length(14, 14)
  paymentInitiatorDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientConciliationId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  key?: string;

  @IsString()
  @Length(8, 8)
  thirdPartIspb: string;

  @IsEnum(JdpiPersonType)
  thirdPartPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsEnum(JdpiAccountType)
  thirdPartAccountType: JdpiAccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @Length(8, 8)
  clientIspb: string;

  @IsEnum(JdpiPersonType)
  clientPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
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
  amountDetails?: TDetailValue[];

  @IsString()
  @IsOptional()
  @MaxLength(255)
  informationBetweenClients?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleFailedNotifyCreditDepositJdpiEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyCreditDepositJdpiEventController {
  /**
   * Handler triggered to create failed NotifyCreditDeposit.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCreditDepositRepository: NotifyCreditDepositRepository,
    eventEmitter: NotifyCreditDepositEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditDepositJdpiEventController.name,
    });

    const controllerEventEmitter =
      new NotifyCreditDepositEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyCreditDepositRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyCreditDepositJdpiEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create failed notify credit deposit request.', {
      request,
    });

    const notifyCreditDeposit = new NotifyCreditDepositEntity({
      externalId: request.externalId,
      endToEndId: request.endToEndId,
      initiationType: Parse.getInitiationType(request.initiationType),
      paymentPriorityType: Parse.getPaymentPriorityType(
        request.paymentPriorityType,
      ),
      paymentPriorityLevelType: Parse.getPaymentPriorityLevelType(
        request.paymentPriorityLevelType,
      ),
      finalityType: request.finalityType,
      agentModalityType:
        request.agentModalityType &&
        Parse.getAgentMod(request.agentModalityType),
      ...(request.ispbPss && { ispbPss: request.ispbPss }),
      ...(request.paymentInitiatorDocument && {
        paymentInitiatorDocument: request.paymentInitiatorDocument,
      }),
      ...(request.clientConciliationId && {
        clientConciliationId: request.clientConciliationId,
      }),
      ...(request.key && { key: request.key }),
      thirdPartIspb: request.thirdPartIspb,
      thirdPartPersonType: Parse.getPersonType(request.thirdPartPersonType),
      thirdPartDocument: request.thirdPartDocument,
      ...(request.thirdPartBranch && {
        thirdPartBranch: request.thirdPartBranch,
      }),
      thirdPartAccountType: Parse.getAccountType(request.thirdPartAccountType),
      thirdPartAccountNumber: request.thirdPartAccountNumber,
      thirdPartName: request.thirdPartName,
      ...(request.clientBranch && {
        clientBranch: request.clientBranch,
      }),
      clientPersonType: Parse.getPersonType(request.clientPersonType),
      clientIspb: request.clientIspb,
      clientDocument: request.clientDocument,
      ...(request.clientBranch && { clientBranch: request.clientBranch }),
      clientAccountType: Parse.getAccountType(request.clientAccountType),
      clientAccountNumber: request.clientAccountNumber,
      createdAt: request.createdAt,
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
    });

    await this.usecase.execute(notifyCreditDeposit);
  }
}
