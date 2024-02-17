export const CRON_TASKS = {
  WALLET_INVITATION: {
    SYNC_PENDING_WALLET_INVITATION:
      'OPERATIONS.walletInvitation.syncPendingWalletInvitation',
  },
  OPERATIONS: {
    SYNC_ACCOUNTS_CLOSURES_REPORTS:
      'OPERATIONS.operation.syncReportsAccountsClosures',
    SYNC_ASSETS_FORFEITURES_REPORTS:
      'OPERATIONS.operation.syncReportsAssetsForfeitures',
    SYNC_EXTRA_CREDITS_REPORTS: 'OPERATIONS.operation.syncReportsExtraCredits',
    SYNC_P2P_CHATS_REPORTS: 'OPERATIONS.operation.syncReportsP2PChats',
    SYNC_P2P_TRANSFERS_REPORTS: 'OPERATIONS.operation.syncReportsP2PTransfers',
    SYNC_DEPOSITS_RECEIVE_REPORTS:
      'OPERATIONS.operation.syncReportsDepositsReceive',
    SYNC_CONVERSIONS_REPORTS: 'OPERATIONS.operation.syncReportsConversions',
    SYNC_GATEWAY_REPORTS: 'OPERATIONS.operation.syncReportsGateway',
    SYNC_CREATE_INDEX: 'OPERATIONS.operation.createOperationIndex',
    SYNC_DELETE_INDEX: 'OPERATIONS.operation.deleteOperationIndex',
  },
  USER_LIMIT_TRACKER: {
    SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL:
      'OPERATIONS.userLimitTracker.syncUpdateUserLimitTrackerByInterval',
  },
};
