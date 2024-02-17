import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import {
  PixDevolutionEvent,
  PixDevolutionEventEmitter,
} from '@zro/api-topazio/application';

export enum PixDevolutionEventType {
  COMPLETED = 'COMPLETED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TPixDevolutionControllerEvent = {
  userId: UserId;
  walletId: WalletId;
} & Pick<PixDevolutionEvent, 'id' | 'state' | 'endToEndId'>;

export class PixDevolutionControllerEvent
  extends AutoValidator
  implements TPixDevolutionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  constructor(props: TPixDevolutionControllerEvent) {
    super(props);
  }
}

export interface PixDevolutionEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDevolutionEvent(
    eventName: PixDevolutionEventType,
    event: PixDevolutionControllerEvent,
  ): void;
}

export class PixDevolutionEventEmitterController
  implements PixDevolutionEventEmitter
{
  constructor(
    private eventEmitter: PixDevolutionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit complete devolution event.
   * @param event PixDevolution.
   */
  completedDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      endToEndId: event.endToEndId,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.COMPLETED,
      controllerEvent,
    );
  }
}
