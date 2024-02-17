import {
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
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  NotifyCreditDevolutionEvent,
  NotifyCreditDevolutionEventEmitter,
} from '@zro/api-jdpi/application';

export enum NotifyCreditDevolutionEventType {
  ERROR = 'ERROR',
}

type TNotifyCreditDevolutionControllerEvent = NotifyCreditDevolutionEvent;

export class NotifyCreditDevolutionControllerEvent
  extends AutoValidator
  implements TNotifyCreditDevolutionControllerEvent
{
  @IsUUID(4)
  externalId: string;

  @IsString()
  @MaxLength(255)
  originalEndToEndId: string;

  @IsString()
  @MaxLength(255)
  devolutionEndToEndId: string;

  @IsString()
  @MaxLength(4)
  devolutionCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  devolutionReason?: string;

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

  @IsString()
  @IsOptional()
  informationBetweenClients?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TNotifyCreditDevolutionControllerEvent) {
    super(props);
  }
}

export interface NotifyCreditDevolutionEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCreditDevolutionEvent: (
    eventName: NotifyCreditDevolutionEventType,
    event: NotifyCreditDevolutionControllerEvent,
  ) => void;
}

export class NotifyCreditDevolutionEventEmitterController
  implements NotifyCreditDevolutionEventEmitter
{
  constructor(
    private eventEmitter: NotifyCreditDevolutionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCreditDevolution(event: NotifyCreditDevolutionEvent): void {
    const controllerEvent = new NotifyCreditDevolutionControllerEvent({
      externalId: event.externalId,
      originalEndToEndId: event.originalEndToEndId,
      devolutionEndToEndId: event.devolutionEndToEndId,
      devolutionCode: event.devolutionCode,
      ...(event.devolutionReason && {
        devolutionReason: event.devolutionReason,
      }),
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
      ...(event.informationBetweenClients && {
        informationBetweenClients: event.informationBetweenClients,
      }),
      createdAt: event.createdAt,
    });

    this.eventEmitter.emitCreditDevolutionEvent(
      NotifyCreditDevolutionEventType.ERROR,
      controllerEvent,
    );
  }
}
