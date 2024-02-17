export enum JdpiErrorTypes {
  ENTRY_ALREADY_EXISTS = 'EntryAlreadyExists',
  ENTRY_KEY_OWNED_BY_DIFFERENT_PERSON = 'EntryKeyOwnedByDifferentPerson',
  ENTRY_KEY_IN_CUSTODY_OF_DIFFERENT_PARTICIPANT = 'EntryKeyInCustodyOfDifferentParticipant',
  ENTRY_LOCKED_BY_CLAIM = 'EntryLockedByClaim',
  ENTRY_LIMIT_EXCEEDED = 'EntryLimitExceeded',
  ENTRY_INVALID = 'EntryInvalid',
  INTERNAL_SERVER_ERROR = 'InternalServerError',
  SERVICE_UNAVAILABLE = 'ServiceUnavailable',
  NOT_FOUND = 'NotFound',
  CLAIM_INVALID = 'ClaimInvalid',
  CLAIM_TYPE_INCONSISTENT = 'ClaimTypeInconsistent',
  CLAIM_KEY_NOT_FOUND = 'ClaimKeyNotFound',
  CLAIM_ALREADY_EXISTS_FOR_KEY = 'ClaimAlreadyExistsForKey',
  CLAIM_RESULTING_ENTRY_ALREADY_EXISTS = 'ClaimResultingEntryAlreadyExists',
  CLAIM_OPERATION_INVALID = 'ClaimOperationInvalid',
  CLAIM_RESOLUTION_PERIOD_NOT_ENDED = 'ClaimResolutionPeriodNotEnded',
  CLAIM_COMPLETION_PERIOD_NOT_ENDED = 'ClaimCompletionPeriodNotEnded',
  INFRACTION_REPORT_INVALID = 'InfractionReportInvalid',
  INFRACTION_REPORT_OPERATION_INVALID = 'InfractionReportOperationInvalid',
  INFRACTION_REPORT_TRANSACTION_NOT_FOUND = 'InfractionReportTransactionNotFound',
  INFRACTION_REPORT_TRANSACTION_NOT_SETTLED = 'InfractionReportTransactionNotSettled',
  INFRACTION_REPORT_ALREADY_BEING_PROCESSED_FOR_TRANSACTION = 'InfractionReportAlreadyBeingProcessedForTransaction',
  INFRACTION_REPORT_ALREADY_PROCESSED_FOR_TRANSACTION = 'InfractionReportAlreadyProcessedForTransaction',
  INFRACTION_REPORT_PERIOD_EXPIRED = 'InfractionReportPeriodExpired',
  DECODE_QR_CODE_TIMEOUT = '408',
}

export enum JdpiErrorCode {
  AB03 = 'AB03',
  AB09 = 'AB09',
  AB11 = 'AB11',
  AC03 = 'AC03',
  AC06 = 'AC06',
  AC07 = 'AC07',
  AC14 = 'AC14',
  AG03 = 'AG03',
  AG12 = 'AG12',
  AG13 = 'AG13',
  AGNT = 'AGNT',
  AM01 = 'AM01',
  AM02 = 'AM02',
  AM04 = 'AM04',
  AM09 = 'AM09',
  AM12 = 'AM12',
  AM18 = 'AM18',
  BE01 = 'BE01',
  BE05 = 'BE05',
  BE17 = 'BE17',
  CH11 = 'CH11',
  CH16 = 'CH16',
  DS04 = 'DS04',
  DS0G = 'DS0G',
  DS24 = 'DS24',
  DS27 = 'DS27',
  DT02 = 'DT02',
  DT05 = 'DT05',
  ED05 = 'ED05',
  FF07 = 'FF07',
  FF08 = 'FF08',
  MD01 = 'MD01',
  RC09 = 'RC09',
  RC10 = 'RC10',
  RR04 = 'RR04',
  SL02 = 'SL02',
}

export enum JdpiPersonType {
  NATURAL_PERSON = 0,
  LEGAL_PERSON = 1,
}

export enum JdpiKeyType {
  CPF = 0,
  CNPJ = 1,
  EMAIL = 2,
  PHONE = 3,
  EVP = 4,
}

export enum JdpiAccountType {
  CACC = 0,
  SALARY_ACCOUNT = 1,
  SAVING_ACCOUNT = 2,
  PAYMENT_ACCOUNT = 3,
}

export enum JdpiReasonType {
  USER_REQUESTED = 0,
  ACCOUNT_CLOSURE = 1,
  FRAUD = 4,
  DEFAULT_RESPONSE = 5,
  RECONCILIATION = 6,
}

export enum JdpiFormatQrCode {
  IMAGE = 0,
  PAYLOAD = 1,
  BOTH = 2,
}

export enum JdpiClaimType {
  PORTABILITY = 0,
  OWNERSHIP = 1,
}

export enum JdpiClaimStatusType {
  OPEN = 0,
  WAITING_RESOLUTION = 1,
  CONFIRMED = 2,
  CANCELLED = 3,
  COMPLETED = 4,
}

export enum JdpiCanceledBy {
  OWNER = 0,
  CLAIMANT = 1,
}

export enum JdpiClaimParticipationFlow {
  CLAIMANT = 0,
  DONOR = 1,
}

export enum JdpiQRCodeStatus {
  ACTIVE = 0,
  CONCLUDED = 1,
  DELETED_RECEPTOR = 2,
  DELETED_PSP = 3,
}

export enum JdpiDecodeQrCodeType {
  QR_CODE_STATIC = 11,
  QR_CODE_DYNAMIC = 12,
  QR_CODE_DYNAMIC_DUE_DATE = 13,
}

export enum JdpiAgentModalityType {
  WITHDRAWAL_FACILITATOR = 0,
  COMMERCIAL_ESTABLISHMENT = 1,
  OTHER_TYPE = 2,
}

export enum JdpiModalityUpdateType {
  NOT_ALLOW = 0,
  ALLOW = 1,
}

export enum JdpiPixKeyReasonType {
  USER_REQUESTED = 0,
  RECONCILIATION = 6,
}

export enum JdpiClaimReason {
  CUSTOMER_REQUEST = 0,
  CLOSURE_ACCOUNT = 1,
  FRAUD = 4,
  STANDARD_RESPONSE = 5,
}

export enum JdpiCancellationReason {
  CUSTOMER_REQUEST = 0,
  CLOSURE_ACCOUNT = 1,
  FRAUD = 4,
  STANDARD_RESPONSE = 5,
  RECONCILIATION = 6,
}

export enum JdpiPaymentType {
  MANUAL = 0,
  KEY = 1,
  QRCODE_STATIC = 2,
  QRCODE_DYNAMIC = 3,
  PAYMENT_SERVICE = 6,
  QRCODE_PAID = 7,
}

export enum JdpiPaymentPriorityType {
  PRIORITY = 0,
  NOT_PRIORITY = 1,
}

export enum JdpiPaymentPriorityLevelType {
  PRIORITY_PAYMENT = 0,
  PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS = 1,
  SCHEDULED_PAYMENT = 2,
}

export enum JdpiFinalityType {
  PIX_TRANSFER = 0,
  PIX_CHANGE = 1,
  PIX_WITHDRAWAL = 2,
}

export enum JdpiValueType {
  RESOURCE = 0,
  PURCHASE = 1,
}

export enum JdpiOperationType {
  DEBIT = 0,
  CREDIT = 1,
}

export enum JdpiPixInfractionTransactionType {
  INTERNAL = 0,
  EXTERNAL = 1,
}

export enum JdpiPixInfractionType {
  REFUND_REQUEST = 1,
  CANCEL_DEVOLUTION = 2,
}

export enum JdpiPixInfractionReason {
  FRAUD = 0,
  UNAUTHORIZED = 1,
  COERSION_CRIME = 2,
  FRAUDULENT_ACCESS = 3,
  OTHER = 4,
  UNKNOWN = 5,
}

export enum JdpiPixInfractionReport {
  DEBITED_PARTICIPANT = 0,
  CREDITED_PARTICIPANT = 1,
}

export enum JdpiPixInfractionTransactionResult {
  SETTLED = 0,
  REJECTED_PSP_RECEIVE = 1,
  REJECTED_PSP_PAYER = 2,
}

export enum JdpiPixInfractionStatus {
  OPEN = 0,
  ACKNOWLEDGED = 1,
  CANCELLED = 2,
  CLOSED = 3,
}

export enum JdpiPixInfractionAnalysisResultType {
  AGREED = 0,
  DISAGREED = 1,
}

export enum JdpiResultType {
  INVALID = 0,
  VALID = 1,
}

export enum JdpiLaunchType {
  CREDIT_ENTRY = 0,
  DEBIT_ENTRY = 1,
}

export enum JdpiLaunchSituation {
  SETTLED = 0,
  NOT_SETTLED = 1,
  PROCESSING = 9,
}

export enum JdpiPaymentStatus {
  ERROR_WHILE_PROCESSING = -1,
  PROCESSING = 0,
  SETTLED = 9,
}

export enum JdpiPaymentProcessSituation {
  SETTLED = 0,
  ERROR_WHILE_PROCESSING = 1,
  ERROR_DATA_VALIDATION = 2,
  ERROR_SPI = 3,
  ERROR_RESPONSE_NOT_FOUND = 5,
  WAITING_SPI = 8,
  PROCESSING = 9,
}

export enum JdpiAgentType {
  CONTRAPART_STR = 0,
  CONTRAPART_SELIC = 1,
}

export enum JdpiPixInfractionFraudType {
  FALSE_IDENTIFICATION = 0,
  DUMMY_ACCOUNT = 1,
  FRAUDSTER_ACCOUNT = 2,
  OTHER = 3,
  UNKNOWN = 4, // Frauds originating from closed infringements in API DICT 1.9.1.
}

export enum JdpiPixRefundReasonType {
  PSP_ERROR = 0,
  FRAUD = 1,
  CANCELLED = 2,
}

export enum JdpiPixRefundStatus {
  OPEN = 0,
  CANCELLED = 1,
  CLOSED = 2,
}

export enum JdpiPixRefundAnalysisResult {
  TOTALLY_AGREED = 0,
  PARTIALLY_AGREED = 1,
  REJECTED = 2,
}

export enum JdpiPixRefundRejectionReason {
  NOT_ENOUGH_BALANCE = 0,
  ACCOUNT_CLOSURE = 1,
  ANOTHER_REASON = 3,
}

export enum JdpiPixRefundParticipant {
  REQUESTING = 0,
  CONTESTED = 1,
}

export enum JdpiTypeTransactionReported {
  SPI = 0,
  INTERNAL = 1,
}

export enum JdpiTypeDomainInfraction {
  FRAUD = 0,
  RETURN_REQUEST = 1,
  RETURN_CANCELLATION = 2,
}

export enum JdpiResultReportedTransaction {
  LIQUIDATED = 0,
  REJECTED_BY_RECEIVING_PSP = 1,
  REJECTED_BY_PAYING_PSP = 2,
}

export enum JdpiChannelType {
  CPM = 0, // primary
  CSM = 1, // secondary
}

export enum JdpiFraudDetectionStatus {
  REGISTERED = 0,
  CANCELED = 1,
}
