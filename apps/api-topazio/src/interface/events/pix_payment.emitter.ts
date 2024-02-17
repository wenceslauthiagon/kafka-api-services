import {
  IsEnum,
  IsUUID,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import {
  PixPaymentEvent,
  PixPaymentEventEmitter,
} from '@zro/api-topazio/application';

export enum PixPaymentEventType {
  COMPLETED = 'COMPLETED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TPixPaymentControllerEvent = { userId: UserId; walletId: WalletId } & Pick<
  PixPaymentEvent,
  'id' | 'state' | 'endToEndId'
>;

export class PixPaymentControllerEvent
  extends AutoValidator
  implements TPixPaymentControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  constructor(props: TPixPaymentControllerEvent) {
    super(props);
  }
}

export interface PixPaymentEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPaymentEvent(
    eventName: PixPaymentEventType,
    event: PixPaymentControllerEvent,
  ): void;
}

export class PixPaymentEventEmitterController
  implements PixPaymentEventEmitter
{
  constructor(
    private eventEmitter: PixPaymentEventEmitterControllerInterface,
  ) {}

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedPayment(event: PixPaymentEvent): void {
    const controllerEvent = new PixPaymentControllerEvent({
      id: event.id,
      endToEndId: event.endToEndId,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitPaymentEvent(
      PixPaymentEventType.COMPLETED,
      controllerEvent,
    );
  }
}
