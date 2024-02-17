import { Operation } from '@zro/operations/domain';

export type OperationItemEvent = Partial<
  Pick<
    Operation,
    | 'id'
    | 'owner'
    | 'ownerWalletAccount'
    | 'beneficiary'
    | 'beneficiaryWalletAccount'
    | 'transactionType'
    | 'currency'
    | 'rawValue'
    | 'fee'
    | 'value'
    | 'description'
    | 'operationRef'
    | 'state'
    | 'ownerRequestedRawValue'
    | 'ownerRequestedFee'
    | 'analysisTags'
    | 'userLimitTracker'
    | 'createdAt'
  >
>;

export type OperationEvent = {
  ownerOperation?: OperationItemEvent;
  beneficiaryOperation?: OperationItemEvent;
};

export interface OperationEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingOperation: (event: OperationEvent) => void;

  /**
   * Emit accepted event.
   * @param event Data.
   */
  acceptedOperation: (event: OperationEvent) => void;

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedOperation: (event: OperationEvent) => void;
}
