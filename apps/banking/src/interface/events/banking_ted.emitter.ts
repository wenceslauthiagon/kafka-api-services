import { IsEnum, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BankingTedState } from '@zro/banking/domain';
import { Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  BankingTedEvent,
  BankingTedEventEmitter,
} from '@zro/banking/application';

export enum BankingTedEventType {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  FORWARDED = 'FORWARDED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TBankingTedControllerEvent = {
  userId: UserId;
  walletId?: WalletId;
} & Pick<BankingTedEvent, 'id' | 'state'>;

export class BankingTedControllerEvent
  extends AutoValidator
  implements TBankingTedControllerEvent
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state: BankingTedState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  constructor(props: TBankingTedControllerEvent) {
    super(props);
  }
}

export interface BankingTedEventEmitterControllerInterface {
  /**
   * Call banks microservice to emit banking ted.
   * @param eventName The event name.
   * @param event Data.
   */
  emitBankingTedEvent: (
    eventName: BankingTedEventType,
    event: BankingTedControllerEvent,
  ) => void;
}

export class BankingTedEventEmitterController
  implements BankingTedEventEmitter
{
  constructor(
    private eventEmitter: BankingTedEventEmitterControllerInterface,
  ) {}

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  pendingBankingTed(event: BankingTedEvent): void {
    const controllerEvent = new BankingTedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet?.uuid,
    });

    this.eventEmitter.emitBankingTedEvent(
      BankingTedEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  waitingBankingTed(event: BankingTedEvent): void {
    const controllerEvent = new BankingTedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet?.uuid,
    });

    this.eventEmitter.emitBankingTedEvent(
      BankingTedEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  forwardedBankingTed(event: BankingTedEvent): void {
    const controllerEvent = new BankingTedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet?.uuid,
    });

    this.eventEmitter.emitBankingTedEvent(
      BankingTedEventType.FORWARDED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  confirmedBankingTed(event: BankingTedEvent): void {
    const controllerEvent = new BankingTedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet?.uuid,
    });

    this.eventEmitter.emitBankingTedEvent(
      BankingTedEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  failedBankingTed(event: BankingTedEvent): void {
    const controllerEvent = new BankingTedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet?.uuid,
    });

    this.eventEmitter.emitBankingTedEvent(
      BankingTedEventType.FAILED,
      controllerEvent,
    );
  }
}
