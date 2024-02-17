import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsPositive,
  IsInt,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  PixFraudDetectionEvent,
  PixFraudDetectionEventEmitter,
} from '@zro/pix-payments/application';

export enum PixFraudDetectionEventType {
  RECEIVED = 'RECEIVED',
  RECEIVED_PENDING = 'RECEIVED_PENDING',
  RECEIVED_CONFIRMED = 'RECEIVED_CONFIRMED',
  REGISTERED = 'REGISTERED',
  REGISTERED_PENDING = 'REGISTERED_PENDING',
  REGISTERED_CONFIRMED = 'REGISTERED_CONFIRMED',
  CANCELED_RECEIVED = 'CANCELED_RECEIVED',
  CANCELED_RECEIVED_PENDING = 'CANCELED_RECEIVED_PENDING',
  CANCELED_RECEIVED_CONFIRMED = 'CANCELED_RECEIVED_CONFIRMED',
  CANCELED_REGISTERED = 'CANCELED_REGISTERED',
  CANCELED_REGISTERED_PENDING = 'CANCELED_REGISTERED_PENDING',
  CANCELED_REGISTERED_CONFIRMED = 'CANCELED_REGISTERED_CONFIRMED',
  FAILED = 'FAILED',
}

type TPixFraudDetectionControllerEvent = PixFraudDetectionEvent;

export class PixFraudDetectionControllerEvent
  extends AutoValidator
  implements TPixFraudDetectionControllerEvent
{
  @IsOptional()
  @IsUUID(4)
  id?: string;

  @IsUUID(4)
  @IsOptional()
  externalId?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  issueId?: number;

  @IsString()
  @Length(11, 14)
  document: string;

  @IsEnum(PixFraudDetectionType)
  fraudType: PixFraudDetectionType;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsEnum(PixFraudDetectionStatus)
  status: PixFraudDetectionStatus;

  @IsOptional()
  @IsEnum(PixFraudDetectionState)
  state?: PixFraudDetectionState;

  @IsOptional()
  @IsString()
  failedMessage: string;

  @IsOptional()
  @IsString()
  failedCode: string;

  constructor(props: TPixFraudDetectionControllerEvent) {
    super(props);
  }
}

export interface PixFraudDetectionEventEmitterControllerInterface {
  /**
   * Emit pix fraud detection event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPixFraudDetectionEvent(
    eventName: PixFraudDetectionEventType,
    event: PixFraudDetectionControllerEvent,
  ): void;
}

export class PixFraudDetectionEventEmitterController
  implements PixFraudDetectionEventEmitter
{
  constructor(
    private eventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit receive event.
   * @param event Data.
   */
  receivedPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit receive pending event.
   * @param event Data.
   */
  receivedPendingPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
      state: event.state,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.RECEIVED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit receive confirmed event.
   * @param event Data.
   */
  receivedConfirmedPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
      state: event.state,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.RECEIVED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit register pending event.
   * @param event Data.
   */
  registerPendingPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.REGISTERED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit register confirmed event.
   * @param event Data.
   */
  registerConfirmedPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.REGISTERED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit cancel pending registered event.
   * @param event Data.
   */
  cancelPendingPixFraudDetectionRegistered(
    event: PixFraudDetectionEvent,
  ): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.CANCELED_REGISTERED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit cancel confirmed registered event.
   * @param event Data.
   */
  cancelConfirmedPixFraudDetectionRegistered(
    event: PixFraudDetectionEvent,
  ): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.CANCELED_REGISTERED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit cancel received event.
   * @param event Data.
   */
  cancelPixFraudDetectionReceived(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.CANCELED_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit cancel pending received event.
   * @param event Data.
   */
  cancelPendingPixFraudDetectionReceived(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      id: event.id,
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.CANCELED_RECEIVED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit cancel confirmed received event.
   * @param event Data.
   */
  cancelConfirmedPixFraudDetectionReceived(
    event: PixFraudDetectionEvent,
  ): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      externalId: event.externalId,
      document: event.document,
      fraudType: event.fraudType,
      key: event.key,
      status: event.status,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.CANCELED_RECEIVED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedPixFraudDetection(event: PixFraudDetectionEvent): void {
    const controllerEvent = new PixFraudDetectionControllerEvent({
      externalId: event.externalId,
      failedMessage: event.failedMessage,
      failedCode: event.failedCode,
    });

    this.eventEmitter.emitPixFraudDetectionEvent(
      PixFraudDetectionEventType.FAILED,
      controllerEvent,
    );
  }
}
