import { NotifyCreditDevolution } from '@zro/api-jdpi/domain';

export type NotifyCreditDevolutionEvent = Pick<
  NotifyCreditDevolution,
  | 'externalId'
  | 'originalEndToEndId'
  | 'devolutionEndToEndId'
  | 'devolutionCode'
  | 'devolutionReason'
  | 'thirdPartIspb'
  | 'thirdPartDocument'
  | 'thirdPartPersonType'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartName'
  | 'clientIspb'
  | 'clientDocument'
  | 'clientPersonType'
  | 'clientBranch'
  | 'clientAccountType'
  | 'clientAccountNumber'
  | 'amount'
  | 'informationBetweenClients'
  | 'createdAt'
>;

export interface NotifyCreditDevolutionEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCreditDevolution: (event: NotifyCreditDevolutionEvent) => void;
}
