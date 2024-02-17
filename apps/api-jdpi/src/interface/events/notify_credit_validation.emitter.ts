import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  ResultType,
  PaymentPriorityLevelType,
  ValueType,
  InitiationType,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PaymentPriorityType,
  PixAgentMod,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import {
  NotifyCreditValidationAmountDetailsEvent,
  NotifyCreditValidationEvent,
  NotifyCreditValidationEventEmitter,
} from '@zro/api-jdpi/application';
import { JdpiErrorCode } from '@zro/jdpi/domain';

class NotifyCreditValidationAmountDetailsControllerEvent
  extends AutoValidator
  implements NotifyCreditValidationAmountDetailsEvent
{
  @IsInt()
  @IsPositive()
  fareBuyAmount: number;

  @IsEnum(ValueType)
  valueType: ValueType;
}

class NotifyCreditValidationResponseControllerEvent extends AutoValidator {
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
}

export class NotifyCreditValidationControllerEvent
  extends AutoValidator
  implements NotifyCreditValidationEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  groupId?: string;

  @IsEnum(InitiationType)
  initiationType: InitiationType;

  @IsEnum(PaymentPriorityType)
  paymentPriorityType: PaymentPriorityType;

  @IsEnum(PaymentPriorityLevelType)
  paymentPriorityLevelType: PaymentPriorityLevelType;

  @IsInt()
  finalityType: number;

  @IsEnum(PixAgentMod)
  @IsOptional()
  agentModalityType?: PixAgentMod;

  @IsString()
  @IsOptional()
  ispbPss?: string;

  @IsString()
  @Length(14)
  @IsOptional()
  paymentInitiatorDocument?: string;

  @IsString()
  thirdPartIspb: string;

  @IsEnum(PersonType)
  thirdPartPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  thirdPartName: string;

  @IsString()
  @IsOptional()
  thirdPartBranch?: string;

  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  clientIspb: string;

  @IsEnum(PersonType)
  clientPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @IsOptional()
  clientBranch?: string;

  @IsEnum(AccountType)
  clientAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsArray()
  @IsOptional()
  amountDetails?: NotifyCreditValidationAmountDetailsControllerEvent[];

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

  @IsObject()
  response: NotifyCreditValidationResponseControllerEvent;

  constructor(props: NotifyCreditValidationEvent) {
    super({
      id: props.id,
      ...(props.groupId && { groupId: props.groupId }),
      initiationType: props.initiationType,
      paymentPriorityType: props.paymentPriorityType,
      paymentPriorityLevelType: props.paymentPriorityLevelType,
      finalityType: props.finalityType,
      ...(props.agentModalityType && {
        agentModalityType: props.agentModalityType,
      }),
      ...(props.ispbPss && { ispbPss: props.ispbPss }),
      ...(props.paymentInitiatorDocument && {
        paymentInitiatorDocument: props.paymentInitiatorDocument,
      }),
      thirdPartIspb: props.thirdPartIspb,
      thirdPartPersonType: props.thirdPartPersonType,
      thirdPartDocument: props.thirdPartDocument,
      thirdPartName: props.thirdPartName,
      ...(props.thirdPartBranch && { thirdPartBranch: props.thirdPartBranch }),
      thirdPartAccountType: props.thirdPartAccountType,
      thirdPartAccountNumber: props.thirdPartAccountNumber,
      clientIspb: props.clientIspb,
      clientPersonType: props.clientPersonType,
      clientDocument: props.clientDocument,
      ...(props.clientBranch && { clientBranch: props.clientBranch }),
      clientAccountType: props.clientAccountType,
      clientAccountNumber: props.clientAccountNumber,
      amount: props.amount,
      ...(props.amountDetails?.length && {
        amountDetails: props.amountDetails.map((amountDetail) => ({
          fareBuyAmount: amountDetail.fareBuyAmount,
          valueType: amountDetail.valueType,
        })),
      }),
      ...(props.informationBetweenClients && {
        informationBetweenClients: props.informationBetweenClients,
      }),
      ...(props.endToEndId && { endToEndId: props.endToEndId }),
      ...(props.clientConciliationId && {
        clientConciliationId: props.clientConciliationId,
      }),
      ...(props.key && { key: props.key }),
      ...(props.originalEndToEndId && {
        originalEndToEndId: props.originalEndToEndId,
      }),
      ...(props.devolutionEndToEndId && {
        devolutionEndToEndId: props.devolutionEndToEndId,
      }),
      ...(props.devolutionCode && { devolutionCode: props.devolutionCode }),
      ...(props.devolutionReason && {
        devolutionReason: props.devolutionReason,
      }),
      response: {
        resultType: props.response.resultType,
        ...(props.response.devolutionCode && {
          devolutionCode: props.response.devolutionCode,
        }),
        ...(props.response.description && {
          description: props.response.description,
        }),
        createdAt: props.response.createdAt,
      },
    });
  }
}

export enum NotifyCreditValidationEventType {
  READY = 'READY',
  PENDING = 'PENDING',
  ERROR = 'ERROR',
}

export interface NotifyCreditValidationEventEmitterControllerInterface {
  /**
   * Emit validation event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitValidationEvent(
    eventName: NotifyCreditValidationEventType,
    event: NotifyCreditValidationControllerEvent,
  ): void;
}

export class NotifyCreditValidationEventEmitterController
  implements NotifyCreditValidationEventEmitter
{
  constructor(
    private eventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
  ) {}

  /**
   * Emit validate credit event.
   * @param event NotifyCreditValidation.
   */
  emitReadyCreditValidation(event: NotifyCreditValidationEvent): void {
    const controllerEvent = new NotifyCreditValidationControllerEvent(event);

    this.eventEmitter.emitValidationEvent(
      NotifyCreditValidationEventType.READY,
      controllerEvent,
    );
  }

  /**
   * Emit validate credit event.
   * @param event NotifyCreditValidation.
   */

  emitPendingCreditValidation(event: NotifyCreditValidationEvent): void {
    const controllerEvent = new NotifyCreditValidationControllerEvent(event);

    this.eventEmitter.emitValidationEvent(
      NotifyCreditValidationEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit validate credit event.
   * @param event NotifyCreditValidation.
   */

  emitErrorCreditValidation(event: NotifyCreditValidationEvent): void {
    const controllerEvent = new NotifyCreditValidationControllerEvent(event);

    this.eventEmitter.emitValidationEvent(
      NotifyCreditValidationEventType.ERROR,
      controllerEvent,
    );
  }
}
