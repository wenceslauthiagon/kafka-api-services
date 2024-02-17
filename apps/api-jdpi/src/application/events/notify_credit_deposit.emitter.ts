import { NotifyCreditDeposit } from '@zro/api-jdpi/domain';

export type NotifyCreditDepositEvent = Pick<
  NotifyCreditDeposit,
  | 'id'
  | 'externalId'
  | 'endToEndId'
  | 'initiationType'
  | 'paymentPriorityType'
  | 'paymentPriorityLevelType'
  | 'finalityType'
  | 'agentModalityType'
  | 'ispbPss'
  | 'paymentInitiatorDocument'
  | 'clientConciliationId'
  | 'key'
  | 'thirdPartAccountNumber'
  | 'thirdPartAccountType'
  | 'thirdPartBranch'
  | 'thirdPartDocument'
  | 'thirdPartIspb'
  | 'thirdPartName'
  | 'thirdPartPersonType'
  | 'clientAccountNumber'
  | 'clientAccountType'
  | 'clientBranch'
  | 'clientDocument'
  | 'clientIspb'
  | 'clientPersonType'
  | 'amount'
  | 'amountDetails'
  | 'informationBetweenClients'
  | 'createdAt'
>;

export interface NotifyCreditDepositEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCreditDeposit: (event: NotifyCreditDepositEvent) => void;
}
