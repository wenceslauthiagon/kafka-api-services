import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionReport,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  PixInfractionEvent,
  PixInfractionEventEmitter,
} from '@zro/pix-payments/application';

export enum PixInfractionEventType {
  NEW = 'NEW',
  OPEN_PENDING = 'OPEN_PENDING',
  OPEN_CONFIRMED = 'OPEN_CONFIRMED',
  ACKNOWLEDGED_PENDING = 'ACKNOWLEDGED_PENDING',
  ACKNOWLEDGED_CONFIRMED = 'ACKNOWLEDGED_CONFIRMED',
  IN_ANALYSIS_PENDING = 'IN_ANALYSIS_PENDING',
  IN_ANALYSIS_CONFIRMED = 'IN_ANALYSIS_CONFIRMED',
  CLOSED_PENDING = 'CLOSED_PENDING',
  CLOSED_CONFIRMED = 'CLOSED_CONFIRMED',
  CLOSED_PENDING_RECEIVED = 'CLOSED_PENDING_RECEIVED',
  CLOSED_CONFIRMED_RECEIVED = 'CLOSED_CONFIRMED_RECEIVED',
  RECEIVE_PENDING = 'RECEIVE_PENDING',
  RECEIVE_CONFIRMED = 'RECEIVE_CONFIRMED',
  CANCEL_PENDING = 'CANCEL_PENDING',
  CANCEL_CONFIRMED = 'CANCEL_CONFIRMED',
  EXPIRED = 'EXPIRED',
  REQUEST_REFUND_RECEIVED = 'REQUEST_REFUND_RECEIVED',
  ERROR = 'ERROR',
  CANCEL_PENDING_RECEIVED = 'CANCEL_PENDING_RECEIVED',
  CANCEL_CONFIRMED_RECEIVED = 'CANCEL_CONFIRMED_RECEIVED',
  RECEIVE = 'RECEIVE',
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  CANCEL_RECEIVED = 'CANCEL_RECEIVED',
  CLOSE_RECEIVED = 'CLOSE_RECEIVED',
}

type TPixInfractionControllerEvent = {
  error?: string;
} & Pick<
  PixInfractionEvent,
  | 'id'
  | 'state'
  | 'infractionPspId'
  | 'infractionType'
  | 'status'
  | 'ispbDebitedParticipant'
  | 'ispbCreditedParticipant'
  | 'reportBy'
  | 'ispb'
  | 'endToEndId'
  | 'creationDate'
  | 'lastChangeDate'
  | 'analysisDetails'
  | 'isReporter'
  | 'analysisResult'
  | 'operationTransactionId'
  | 'reportDetails'
>;

export class PixInfractionControllerEvent
  extends AutoValidator
  implements TPixInfractionControllerEvent
{
  @IsOptional()
  @IsUUID(4)
  id?: string;

  @IsOptional()
  @IsEnum(PixInfractionState)
  state?: PixInfractionState;

  @IsOptional()
  @IsUUID(4)
  operationTransactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reportDetails?: string;

  @IsOptional()
  @IsUUID(4)
  infractionPspId?: string;

  @IsOptional()
  @IsEnum(PixInfractionType)
  infractionType?: PixInfractionType;

  @IsOptional()
  @IsEnum(PixInfractionStatus)
  status?: PixInfractionStatus;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  ispbDebitedParticipant?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  ispbCreditedParticipant?: string;

  @IsOptional()
  @IsEnum(PixInfractionReport)
  reportBy?: PixInfractionReport;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  ispb?: string;

  @IsOptional()
  @IsString()
  endToEndId?: string;

  @IsOptional()
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format creationDate',
  })
  creationDate?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format lastChangeDate',
  })
  lastChangeDate?: Date;

  @IsOptional()
  @IsBoolean()
  isReporter?: boolean;

  @IsOptional()
  @IsString()
  analysisDetails?: string;

  @IsOptional()
  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult?: PixInfractionAnalysisResultType;

  constructor(props: TPixInfractionControllerEvent) {
    super(props);
  }
}

export interface PixInfractionEventEmitterControllerInterface {
  /**
   * Emit infraction event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitInfractionEvent(
    eventName: PixInfractionEventType,
    event: PixInfractionControllerEvent,
  ): void;
}

export class PixInfractionEventEmitterController
  implements PixInfractionEventEmitter
{
  constructor(
    private eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending infraction event.
   * @param event Data.
   */
  newInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.NEW,
      controllerEvent,
    );
  }

  /**
   * Emit open pending infraction event.
   * @param event Data.
   */
  openPendingInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.OPEN_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit open confirmed infraction event.
   * @param event Data.
   */
  openConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.OPEN_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit in analysis confirmed infraction event.
   * @param event Data.
   */
  inAnalysisConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.IN_ANALYSIS_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit acknowledged pending infraction event.
   * @param event Data.
   */
  acknowledgedPendingInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.ACKNOWLEDGED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit acknowledged pending infraction event.
   * @param event Data.
   */
  acknowledgedConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.ACKNOWLEDGED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit closed pending infraction received event.
   * @param event Data.
   */
  closedPendingInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CLOSED_PENDING_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit closed pending infraction received event.
   * @param event Data.
   */
  closedConfirmedInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CLOSED_CONFIRMED_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit pending infraction event.
   * @param event Data.
   */
  closedPendingInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CLOSED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit pending infraction event.
   * @param event Data.
   */
  closedConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CLOSED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit receive pending infraction event.
   * @param event Data.
   */
  receivePendingInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.RECEIVE_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit receive confirmed event.
   * @param event Data.
   */
  receiveConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.RECEIVE_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit pending cancel event.
   * @param event Data.
   */
  cancelPendingInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CANCEL_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confimed cancel event.
   * @param event Data.
   */
  cancelConfirmedInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CANCEL_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit expired event.
   * @param event Data.
   */
  expiredInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.EXPIRED,
      controllerEvent,
    );
  }

  /**
   * Emit request refund event.
   * @param event Data.
   */
  receiveRequestRefundInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.REQUEST_REFUND_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit pending cancel received event.
   * @param event Data.
   */
  cancelPendingInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CANCEL_PENDING_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit confimed cancel received event.
   * @param event Data.
   */
  cancelConfirmedInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CANCEL_CONFIRMED_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit receive event.
   * @param event Data.
   */
  receivePixInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      id: event.id,
      infractionPspId: event.infractionPspId,
      infractionType: event.infractionType,
      status: event.status,
      ispbDebitedParticipant: event.ispbDebitedParticipant,
      ispbCreditedParticipant: event.ispbCreditedParticipant,
      reportBy: event.reportBy,
      ispb: event.ispb,
      endToEndId: event.endToEndId,
      creationDate: event.creationDate,
      lastChangeDate: event.lastChangeDate,
      analysisDetails: event.analysisDetails,
      isReporter: event.isReporter,
      operationTransactionId: event.operationTransactionId,
      reportDetails: event.reportDetails,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.RECEIVE,
      controllerEvent,
    );
  }

  /**
   * Emit acknowledge event.
   * @param event Data.
   */
  acknowledgePixInfraction(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      infractionPspId: event.infractionPspId,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.ACKNOWLEDGE,
      controllerEvent,
    );
  }

  /**
   * Emit cancel received event.
   * @param event Data.
   */
  cancelPixInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      infractionPspId: event.infractionPspId,
      analysisResult: event.analysisResult,
      analysisDetails: event.analysisDetails,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CANCEL_RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit close received event.
   * @param event Data.
   */
  closePixInfractionReceived(event: PixInfractionEvent): void {
    const controllerEvent = new PixInfractionControllerEvent({
      infractionPspId: event.infractionPspId,
      analysisResult: event.analysisResult,
      analysisDetails: event.analysisDetails,
    });

    this.eventEmitter.emitInfractionEvent(
      PixInfractionEventType.CLOSE_RECEIVED,
      controllerEvent,
    );
  }
}
