import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  AccountType,
  PaymentPriorityType,
  PixAgentMod,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';
import {
  InitiationType,
  NotifyCreditDepositAmountDetais,
  PaymentPriorityLevelType,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditDepositEvent,
  NotifyCreditDepositEventEmitter,
} from '@zro/api-jdpi/application';

export enum NotifyCreditDepositEventType {
  ERROR = 'ERROR',
}

type TNotifyCreditDepositControllerEvent = NotifyCreditDepositEvent;

export class NotifyCreditDepositControllerEvent
  extends AutoValidator
  implements TNotifyCreditDepositControllerEvent
{
  @IsUUID(4)
  externalId: string;

  @IsString()
  @MaxLength(255)
  endToEndId: string;

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
  @MaxLength(255)
  ispbPss?: string;

  @IsString()
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
  @MaxLength(255)
  thirdPartIspb: string;

  @IsEnum(PersonType)
  thirdPartPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @MaxLength(255)
  clientIspb: string;

  @IsEnum(PersonType)
  clientPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
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
  amountDetails?: NotifyCreditDepositAmountDetais[];

  @IsString()
  @IsOptional()
  informationBetweenClients?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TNotifyCreditDepositControllerEvent) {
    super(props);
  }
}

export interface NotifyCreditDepositEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCreditDepositEvent: (
    eventName: NotifyCreditDepositEventType,
    event: NotifyCreditDepositControllerEvent,
  ) => void;
}

export class NotifyCreditDepositEventEmitterController
  implements NotifyCreditDepositEventEmitter
{
  constructor(
    private eventEmitter: NotifyCreditDepositEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCreditDeposit(event: NotifyCreditDepositEvent): void {
    const controllerEvent = new NotifyCreditDepositControllerEvent({
      externalId: event.externalId,
      endToEndId: event.endToEndId,
      initiationType: event.initiationType,
      paymentPriorityType: event.paymentPriorityType,
      paymentPriorityLevelType: event.paymentPriorityLevelType,
      finalityType: event.finalityType,
      ...(event.agentModalityType && {
        agentModalityType: event.agentModalityType,
      }),
      ...(event.ispbPss && { ispbPss: event.ispbPss }),
      paymentInitiatorDocument: event.paymentInitiatorDocument,
      clientConciliationId: event.clientConciliationId,
      key: event.key,
      thirdPartIspb: event.thirdPartIspb,
      thirdPartPersonType: event.thirdPartPersonType,
      thirdPartDocument: event.thirdPartDocument,
      thirdPartAccountNumber: event.thirdPartAccountNumber,
      thirdPartAccountType: event.thirdPartAccountType,
      ...(event.thirdPartBranch && { thirdPartBranch: event.thirdPartBranch }),
      thirdPartName: event.thirdPartName,
      clientIspb: event.clientIspb,
      clientPersonType: event.clientPersonType,
      clientDocument: event.clientDocument,
      clientAccountNumber: event.clientAccountNumber,
      clientAccountType: event.clientAccountType,
      ...(event.clientBranch && { clientBranch: event.clientBranch }),
      amount: event.amount,
      ...(event.amountDetails && { amountDetails: event.amountDetails }),
      ...(event.informationBetweenClients && {
        informationBetweenClients: event.informationBetweenClients,
      }),
      createdAt: event.createdAt,
    });

    this.eventEmitter.emitCreditDepositEvent(
      NotifyCreditDepositEventType.ERROR,
      controllerEvent,
    );
  }
}
