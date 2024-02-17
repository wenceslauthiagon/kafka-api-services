import { getMoment } from '@zro/common/utils/get_moment.util';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PixAgentMod,
  PaymentType,
  PixInfractionType,
  PixInfractionStatus,
  PaymentPriorityType,
  PixInfractionReport,
  PixInfractionAnalysisResultType,
  PixRefundStatus,
  PixRefundReason,
  PixRefundType,
  PixRefundRejectionReason,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  OperationType,
  TransactionType,
  PaymentStatusType,
} from '@zro/api-topazio/domain';
import {
  ClaimStatusType,
  ClaimType,
  ClaimReasonType,
  KeyType,
  PixKeyReasonType,
} from '@zro/pix-keys/domain';
import {
  JdpiKeyType,
  JdpiPersonType,
  JdpiAccountType,
  JdpiReasonType,
  JdpiClaimType,
  JdpiClaimStatusType,
  JdpiAgentModalityType,
  JdpiModalityUpdateType,
  JdpiPaymentType,
  JdpiFinalityType,
  JdpiOperationType,
  JdpiPixInfractionStatus,
  JdpiLaunchSituation,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiPixInfractionType,
  JdpiPixInfractionReport,
  JdpiPixInfractionAnalysisResultType,
  JdpiPixRefundStatus,
  JdpiPixRefundReasonType,
  JdpiPixRefundParticipant,
  JdpiPixRefundRejectionReason,
  JdpiPixRefundAnalysisResult,
  JdpiPaymentStatus,
  JdpiResultType,
  JdpiPixInfractionFraudType,
  JdpiFraudDetectionStatus,
} from '@zro/jdpi/domain';
import {
  JdpiPersonTypeException,
  JdpiKeyTypeException,
  JdpiAccountTypeException,
  JdpiReasonException,
  JdpiClaimTypeException,
  JdpiClaimStatusTypeException,
  JdpiAgentModalityTypeException,
  JdpiFinalityTypeException,
  JdpiPaymentTypeException,
  JdpiOperationTypeException,
  JdpiTransactionTypeException,
  JdpiPixInfractionTypeException,
  JdpiPixInfractionStatusException,
  JdpiLaunchSituationException,
  JdpiPixInfractionReportException,
  JdpiPixInfractionaAnalysisResultTypeException,
  JdpiInvalidPixRefundStatusException,
  JdpiInvalidPixRefundReasonTypeException,
  JdpiInvalidPixRefundTypeException,
  JdpiInvalidPixRefundRejectionReasonException,
  JdpiInvalidPixRefundAnalysisResultException,
  JdpiPaymentPriorityTypeException,
  JdpiPaymentPriorityLevelTypeException,
  JdpiPaymentStatusTypeException,
  JdpiResultTypeException,
  JdpiFraudDetectionStatusException,
  JdpiFraudDetectionTypeException,
} from '@zro/jdpi/infrastructure';
import { ResultType } from '@zro/api-jdpi/domain';

export class Sanitize {
  /**
   * Sanitize fullName field with upper case and trim.
   * @param s The fullName.
   * @param [limit] The limit length.
   * @returns Normalized fullName field.
   */
  static fullName(s: string, limit = 80): string {
    return s
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9 ]/g, '') // Remove non alpha-numeric
      .toUpperCase()
      .substring(0, limit);
  }

  /**
   * Sanitize name field with trim and max length.
   * @param s The name.
   * @returns Normalized name field.
   */
  static clearName(s: string): string {
    return s.trim().substring(0, 255);
  }

  /**
   * Sanitize email field.
   * @param s The email.
   * @returns Normalized email field.
   */
  static email(s: string): string {
    return s.toLowerCase();
  }

  /**
   * Sanitize phone field.
   * @param s The phone.
   * @returns Normalized phone field.
   */
  static phone(s: string): string {
    return `+${s.replace(/[^0-9]/g, '')}`; // Remove non digits
  }

  /**
   * Sanitize document field.
   * @param s The document.
   * @returns Normalized document field.
   */
  static document(s: string): string {
    return s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize document field.
   * @param s The document.
   * @returns Normalized document number field.
   */
  static parseDocument(s: string): number {
    return Number(this.document(s));
  }

  /**
   * Sanitize document number field.
   * @param s The document number.
   * @returns Normalized document field.
   */
  static getDocument(s: number, personType: PersonType): string {
    if (personType === PersonType.NATURAL_PERSON) {
      return this.document(String(s).padStart(11, '0'));
    } else {
      return this.document(String(s).padStart(14, '0'));
    }
  }

  /**
   * Sanitize branch number field.
   * @param s The branch number.
   * @returns Normalized branch number field.
   */
  static branch(s: string): string {
    return s
      .replace(/[^0-9]/g, '')
      .padStart(4, '0')
      .substring(0, 4); // Remove non digits
  }

  /**
   * Sanitize account number field.
   * @param s The account number.
   * @returns Normalized account number field.
   */
  static accountNumber(s: string): string {
    return s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize ISPB field.
   * @param s The ISPB.
   * @returns Normalized ISPB field.
   */
  static ispb(s: string): string {
    return s.padStart(8, '0').substring(0, 8); // Remove non digits
  }

  /**
   * Sanitize ISPB field.
   * @param s The ISPB.
   * @returns Normalized ISPB number field.
   */
  static parseIspb(s: string): number {
    return Number(this.ispb(s)); // Remove non digits
  }

  /**
   * Sanitize ISPB number field.
   * @param s The ISPB number.
   * @returns Normalized ISPB field.
   */
  static getIspb(s: number): string {
    return this.ispb(String(s)); // Remove non digits
  }

  /**
   * Sanitize key field.
   * @param s The key.
   * @returns Normalized key field.
   */
  static key(s: string, keyType: KeyType): string {
    if (keyType === KeyType.PHONE) {
      return this.phone(s);
    } else if (keyType === KeyType.EMAIL) {
      return this.email(s);
    } else if ([KeyType.CPF, KeyType.CNPJ].includes(keyType)) {
      return this.document(s);
    }
    return s;
  }

  /**
   * Sanitize txId field.
   * @param s The txId.
   * @param [limit] The limit length.
   * @returns Normalized txId field.
   */
  static txId(s: string, limit = 35): string {
    return s.replace(/[^a-zA-Z0-9]/g, '').substring(0, limit);
  }

  /**
   * Sanitize description field.
   * @param s The description.
   * @returns Normalized description field.
   */
  static description(s: string): string {
    return s.substring(0, 80);
  }

  /**
   * Convert integer (R$ cents) to float (R$ units).
   *
   * @param v Value to be converted.
   * @returns Returns the converted value.
   */
  static parseValue(v: number): number {
    return parseFloat((v / 100.0).toFixed(2));
  }

  /**
   * Convert float (R$ units) to integer (R$ cents).
   *
   * @param value Value to be converted.
   * @returns Returns the converted value.
   */
  static getInt(value: number): number {
    return parseInt(
      Math.floor(0.5 + parseFloat(value.toString()) * 100).toString(),
    );
  }

  /**
   * Convert string date to object Date.
   *
   * @param date Date to be converted.
   * @returns Returns the converted date.
   */
  static toDate(date: string): Date {
    return date && getMoment(date).toDate();
  }

  /**
   * Convert date to format 'YYYY-MM-DD'.
   *
   * @param date Date to be converted to day.
   * @returns Returns the formatted date.
   */
  static formatToYearMonthDay(date: Date): string {
    return date && getMoment(date).format('YYYY-MM-DD');
  }

  /**
   * Convert date to format 'YYYY-MM-DD' with D+1.
   *
   * @param date Date to be converted to day.
   * @returns Returns the formatted date D+1.
   */
  static formatToYearMonthDayDPlusOne(date: Date): string {
    return date && getMoment(date).add(1, 'day').format('YYYY-MM-DD');
  }

  /**
   * Returns the number in seconds of the date subtracted with today.
   *
   * @param date Date to be converted to number.
   * @returns Returns the number of seconds.
   */
  static getDiffSecondsBetweenDateAndNow(date: Date): number {
    return Math.trunc((new Date(date).getTime() - Date.now()) / 1000);
  }

  /**
   * Returns the number in days of the date.
   *
   * @param date Date to be converted to number.
   * @returns Returns the number of days.
   */
  static getDiffDaysBetweenDates(start: Date, end: Date): number {
    return getMoment(end).diff(start, 'days');
  }

  /**
   * Convert enum PersonType to JdpiPersonType.
   *
   * @param personType PersonType to be converted to JDPI ENUM.
   * @returns Returns JDPI ENUM.
   */
  static parsePersonType(personType: PersonType): JdpiPersonType {
    switch (personType) {
      case PersonType.NATURAL_PERSON:
        return JdpiPersonType.NATURAL_PERSON;
      case PersonType.LEGAL_PERSON:
        return JdpiPersonType.LEGAL_PERSON;
      default:
        throw new JdpiPersonTypeException(personType);
    }
  }

  /**
   * Convert enum JdpiPersonType to PersonType.
   *
   * @param personType JdpiPersonType to be converted to Pix Keys ENUM.
   * @returns Returns Pix Keys ENUM.
   */
  static getPersonType(personType: JdpiPersonType): PersonType {
    switch (personType) {
      case JdpiPersonType.NATURAL_PERSON:
        return PersonType.NATURAL_PERSON;
      case JdpiPersonType.LEGAL_PERSON:
        return PersonType.LEGAL_PERSON;
      default:
        throw new JdpiPersonTypeException(personType);
    }
  }

  /**
   * Convert enum KeyType to JdpiKeyType.
   *
   * @param keyType KeyType to be converted to JDPI ENUM.
   * @returns Returns the JDPI ENUM.
   */
  static parseKeyType(keyType: KeyType): JdpiKeyType {
    switch (keyType) {
      case KeyType.CPF:
        return JdpiKeyType.CPF;
      case KeyType.CNPJ:
        return JdpiKeyType.CNPJ;
      case KeyType.EMAIL:
        return JdpiKeyType.EMAIL;
      case KeyType.PHONE:
        return JdpiKeyType.PHONE;
      case KeyType.EVP:
        return JdpiKeyType.EVP;
      default:
        throw new JdpiKeyTypeException(keyType);
    }
  }

  /**
   * Convert enum JdpiKeyType to KeyType.
   *
   * @param keyType JdpiKeyType to be converted to Pix Keys ENUM.
   * @returns Returns the Pix Keys ENUM.
   */
  static getKeyType(keyType: JdpiKeyType): KeyType {
    switch (keyType) {
      case JdpiKeyType.CPF:
        return KeyType.CPF;
      case JdpiKeyType.CNPJ:
        return KeyType.CNPJ;
      case JdpiKeyType.EMAIL:
        return KeyType.EMAIL;
      case JdpiKeyType.PHONE:
        return KeyType.PHONE;
      case JdpiKeyType.EVP:
        return KeyType.EVP;
      default:
        throw new JdpiKeyTypeException(keyType);
    }
  }

  /**
   * Convert enum AccountType to JdpiAccountType.
   *
   * @param accountType AccountType to be converted to JDPI ENUM.
   * @returns Returns the JDPI ENUM.
   */
  static parseAccountType(accountType: AccountType): JdpiAccountType {
    switch (accountType) {
      case AccountType.CACC:
        return JdpiAccountType.CACC;
      case AccountType.SLRY:
        return JdpiAccountType.SALARY_ACCOUNT;
      case AccountType.SVGS:
        return JdpiAccountType.SAVING_ACCOUNT;
      case AccountType.TRAN:
        return JdpiAccountType.PAYMENT_ACCOUNT;
      default:
        throw new JdpiAccountTypeException(accountType);
    }
  }

  static getAccountType(jdpiAccountType: JdpiAccountType): AccountType {
    switch (jdpiAccountType) {
      case JdpiAccountType.CACC:
        return AccountType.CACC;
      case JdpiAccountType.SALARY_ACCOUNT:
        return AccountType.SLRY;
      case JdpiAccountType.SAVING_ACCOUNT:
        return AccountType.SVGS;
      case JdpiAccountType.PAYMENT_ACCOUNT:
        return AccountType.TRAN;
      default:
        throw new JdpiAccountTypeException(jdpiAccountType);
    }
  }

  /**
   * Convert enum PixKeyReasonType to JdpiPixKeyReasonType.
   *
   * @param pixKeyReasonType PixKeyReasonType JDPI ENUM.
   * @returns Returns Returns the JDPI ENUM.
   */
  static parseReason(pixKeyReasonType: PixKeyReasonType): JdpiReasonType {
    switch (pixKeyReasonType) {
      case PixKeyReasonType.USER_REQUESTED:
        return JdpiReasonType.USER_REQUESTED;
      case PixKeyReasonType.RECONCILIATION:
        return JdpiReasonType.RECONCILIATION;
      default:
        throw new JdpiReasonException(pixKeyReasonType);
    }
  }

  /**
   * Convert enum JdpiClaimType to ClaimType.
   *
   * @param claimType JdpiClamType to be converted to Pix Keys ENUM.
   * @returns Returns the Pix Keys ENUM.
   */
  static getClaimType(claimType: JdpiClaimType): ClaimType {
    switch (claimType) {
      case JdpiClaimType.PORTABILITY:
        return ClaimType.PORTABILITY;
      case JdpiClaimType.OWNERSHIP:
        return ClaimType.OWNERSHIP;
      default:
        throw new JdpiClaimTypeException(claimType);
    }
  }

  /**
   * Convert enum JdpiLaunchSituation to PaymentStatusType.
   *
   * @param launchSituation The source status from JdpiLaunchSituation enum.
   * @returns Returns the corresponding PaymentStatusType.
   */
  static getPaymentStatusType(
    launchSituation: JdpiLaunchSituation,
  ): PaymentStatusType {
    switch (launchSituation) {
      case JdpiLaunchSituation.SETTLED:
        return PaymentStatusType.SETTLED;
      case JdpiLaunchSituation.PROCESSING:
        return PaymentStatusType.PROCESSING;
      case JdpiLaunchSituation.NOT_SETTLED:
        return PaymentStatusType.CHARGEBACK;

      default:
        throw new JdpiLaunchSituationException(launchSituation);
    }
  }

  /**
   * Convert enum JdpiClaimStatusType to ClaimStatusType.
   *
   * @param claimStatusType JdpiClamStatusType to be converted to Pix Keys ENUM.
   * @returns Returns the Pix Keys ENUM.
   */
  static getClaimStatusType(
    claimStatusType: JdpiClaimStatusType,
  ): ClaimStatusType {
    switch (claimStatusType) {
      case JdpiClaimStatusType.OPEN:
        return ClaimStatusType.OPEN;
      case JdpiClaimStatusType.WAITING_RESOLUTION:
        return ClaimStatusType.WAITING_RESOLUTION;
      case JdpiClaimStatusType.CONFIRMED:
        return ClaimStatusType.CONFIRMED;
      case JdpiClaimStatusType.CANCELLED:
        return ClaimStatusType.CANCELLED;
      case JdpiClaimStatusType.COMPLETED:
        return ClaimStatusType.COMPLETED;
      default:
        throw new JdpiClaimStatusTypeException(claimStatusType);
    }
  }

  /**
   * Convert enum PixKeyReasonType to JdpiPixKeyReasonType.
   *
   * @param pixKeyReasonType PixKeyReasonType JDPI ENUM.
   * @returns Returns Returns the JDPI ENUM.
   */
  static parseClaimReason(pixKeyReasonType: ClaimReasonType): number {
    switch (pixKeyReasonType) {
      case ClaimReasonType.FRAUD:
        return JdpiReasonType.FRAUD;
      case ClaimReasonType.USER_REQUESTED:
        return JdpiReasonType.USER_REQUESTED;
      case ClaimReasonType.ACCOUNT_CLOSURE:
        return JdpiReasonType.ACCOUNT_CLOSURE;
      case ClaimReasonType.DEFAULT_OPERATION:
        return JdpiReasonType.DEFAULT_RESPONSE;
      default:
        throw new JdpiReasonException(pixKeyReasonType);
    }
  }

  /**
   * Convert JdpiOperationType to TransactionType.
   *
   * @param tpOperacao The JdpiOperationType value to be converted.
   * @returns The corresponding TransactionType value.
   */
  static getTransactionType(
    jdpiOperationType: JdpiOperationType,
  ): TransactionType {
    switch (jdpiOperationType) {
      case JdpiOperationType.CREDIT:
        return TransactionType.CREDIT;
      case JdpiOperationType.DEBIT:
        return TransactionType.DEBIT;
      default:
        throw new JdpiTransactionTypeException(jdpiOperationType);
    }
  }

  /**
   * Convert JdpiOperationType to OperationType.
   *
   * @param jdpiOperationType The JdpiOperationType value to be converted.
   * @returns The corresponding OperationType value.
   */
  static getOperationType(jdpiOperationType: JdpiOperationType): OperationType {
    switch (jdpiOperationType) {
      case JdpiOperationType.CREDIT:
        return OperationType.CREDIT;
      case JdpiOperationType.DEBIT:
        return OperationType.DEBIT;
      default:
        throw new JdpiOperationTypeException(jdpiOperationType);
    }
  }

  /**
   * decode payloadBase64 to utf8.
   *
   * @param payloadBase64 base64 to be converted to utf8 string.
   * @returns Returns the utf8 string.
   */
  static decodeBase64(payloadBase64: string): string {
    return Buffer.from(payloadBase64, 'base64').toString('utf8');
  }

  /**
   * Convert enum JdpiAgentModalityType to PixAgentMod.
   *
   * @param jdpiAgentModalityType JdpiAgentModalityType to be converted to PixAgentMod.
   * @returns Returns the PixAgentMod.
   */
  static getAgentMod(
    jdpiAgentModalityType: JdpiAgentModalityType,
  ): PixAgentMod {
    switch (jdpiAgentModalityType) {
      case JdpiAgentModalityType.WITHDRAWAL_FACILITATOR:
        return PixAgentMod.AGPSS;
      case JdpiAgentModalityType.COMMERCIAL_ESTABLISHMENT:
        return PixAgentMod.AGTEC;
      case JdpiAgentModalityType.OTHER_TYPE:
        return PixAgentMod.AGTOT;
      default:
        throw new JdpiAgentModalityTypeException(jdpiAgentModalityType);
    }
  }

  /**
   * Convert jdpiModalityUpdateType to boolean.
   *
   * @param jdpiModalityUpdateType JdpiModalityUpdateType to be converted to boolean.
   * @returns Returns the boolean.
   */
  static getModalityUpdateType(
    jdpiModalityUpdateType: JdpiModalityUpdateType,
  ): boolean {
    switch (jdpiModalityUpdateType) {
      case JdpiModalityUpdateType.ALLOW:
        return true;
      default:
        return false;
    }
  }

  /**
   * Convert allowUpdate to JdpiModalityUpdateType enum.
   *
   * @param allowUpdate boolean.
   * @returns Returns the JdpiModalityUpdateType.
   */
  static parseModalityUpdateType(allowUpdate: boolean): JdpiModalityUpdateType {
    return allowUpdate
      ? JdpiModalityUpdateType.ALLOW
      : JdpiModalityUpdateType.NOT_ALLOW;
  }

  /**
   * Convert enum PaymentType to JdpiPaymentType.
   *
   * @param paymentType PaymentType to be converted to JdpiPaymentType.
   * @returns Returns the Jdpi Payment Type.
   */
  static parsePaymentType(paymentType: PaymentType): JdpiPaymentType {
    switch (paymentType) {
      case PaymentType.ACCOUNT:
        return JdpiPaymentType.MANUAL;
      case PaymentType.KEY:
        return JdpiPaymentType.KEY;
      case PaymentType.QR_CODE:
        return JdpiPaymentType.QRCODE_PAID;
      case PaymentType.QR_CODE_STATIC_INSTANT:
      case PaymentType.QR_CODE_STATIC_WITHDRAWAL:
        return JdpiPaymentType.QRCODE_STATIC;
      case PaymentType.QR_CODE_DYNAMIC_DUE_DATE:
      case PaymentType.QR_CODE_DYNAMIC_WITHDRAWAL:
      case PaymentType.QR_CODE_DYNAMIC_CHANGE:
      case PaymentType.QR_CODE_DYNAMIC_INSTANT:
        return JdpiPaymentType.QRCODE_DYNAMIC;
      default:
        throw new JdpiPaymentTypeException(paymentType);
    }
  }

  /**
   * Convert enum PaymentType to JdpiFinality.
   *
   * @param paymentType PaymentType to be converted to JdpiFinality.
   * @returns Returns the Jdpi Finality.
   */
  static parsePaymentTypeToFinality(
    paymentType: PaymentType,
  ): JdpiFinalityType {
    switch (paymentType) {
      case PaymentType.ACCOUNT:
      case PaymentType.KEY:
      case PaymentType.QR_CODE_STATIC_INSTANT:
      case PaymentType.QR_CODE_DYNAMIC_DUE_DATE:
      case PaymentType.QR_CODE_DYNAMIC_INSTANT:
        return JdpiFinalityType.PIX_TRANSFER;
      case PaymentType.QR_CODE_STATIC_WITHDRAWAL:
      case PaymentType.QR_CODE_DYNAMIC_WITHDRAWAL:
        return JdpiFinalityType.PIX_WITHDRAWAL;
      case PaymentType.QR_CODE_DYNAMIC_CHANGE:
        return JdpiFinalityType.PIX_CHANGE;
      default:
        throw new JdpiFinalityTypeException(paymentType);
    }
  }

  /**
   * Convert enum PaymentPriorityType to JdpiPaymentPriorityType.
   *
   * @param priorityType PaymentPriorityType to be converted to JdpiPaymentPriorityType.
   * @returns Returns the Jdpi Payment Priority.
   */
  static parsePaymentPriority(
    priorityType: PaymentPriorityType,
  ): JdpiPaymentPriorityType {
    switch (priorityType) {
      case PaymentPriorityType.NOT_PRIORITY:
        return JdpiPaymentPriorityType.NOT_PRIORITY;
      case PaymentPriorityType.PRIORITY:
        return JdpiPaymentPriorityType.PRIORITY;
      default:
        throw new JdpiPaymentPriorityTypeException(priorityType);
    }
  }

  /**
   * Convert enum PaymentPriorityType to JdpiPaymentPriorityLevelType.
   *
   * @param priorityType PaymentPriorityType to be converted to JdpiPaymentPriorityLevelType.
   * @returns Returns the Jdpi Payment Priority Level.
   */
  static parsePaymentPriorityLevel(
    priorityType: PaymentPriorityType,
  ): JdpiPaymentPriorityLevelType {
    switch (priorityType) {
      case PaymentPriorityType.NOT_PRIORITY:
        return JdpiPaymentPriorityLevelType.SCHEDULED_PAYMENT;
      case PaymentPriorityType.PRIORITY:
        return JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT;
      default:
        throw new JdpiPaymentPriorityLevelTypeException(priorityType);
    }
  }

  /**
   * Convert enum PixAgentMod to JdpiAgentModalityType.
   *
   * @param agentMod PixAgentMod to be converted to JdpiAgentModalityType.
   * @returns Returns the Jdpi Agent Mod.
   */
  static parseAgentMod(agentMod: PixAgentMod): JdpiAgentModalityType {
    switch (agentMod) {
      case PixAgentMod.AGPSS:
        return JdpiAgentModalityType.WITHDRAWAL_FACILITATOR;
      case PixAgentMod.AGTEC:
        return JdpiAgentModalityType.COMMERCIAL_ESTABLISHMENT;
      case PixAgentMod.AGTOT:
        return JdpiAgentModalityType.OTHER_TYPE;
      default:
        throw new JdpiAgentModalityTypeException(agentMod);
    }
  }

  /**
   * Convert enum PixInfractionType to JdpiPixInfractionType.
   *
   * @param infractionType PixInfractionType to be converted to JdpiPixInfractionType.
   * @returns Returns the JdpiPixInfractionType.
   */
  static parseJdpiPixInfractionType(
    infractionType: PixInfractionType,
  ): JdpiPixInfractionType {
    switch (infractionType) {
      case PixInfractionType.FRAUD:
        return JdpiPixInfractionType.REFUND_REQUEST;
      case PixInfractionType.REFUND_REQUEST:
        return JdpiPixInfractionType.REFUND_REQUEST;
      case PixInfractionType.CANCEL_DEVOLUTION:
        return JdpiPixInfractionType.CANCEL_DEVOLUTION;
      default:
        throw new JdpiPixInfractionTypeException(infractionType);
    }
  }

  /**
   * Convert enum JdpiPixInfractionType to PixInfractionType.
   *
   * @param infractionType JdpiPixInfractionType to be converted to PixInfractionType.
   * @returns Returns the PixInfractionType.
   */
  static getPixInfractionType(
    infractionType: JdpiPixInfractionType,
  ): PixInfractionType {
    switch (infractionType) {
      case JdpiPixInfractionType.REFUND_REQUEST:
        return PixInfractionType.REFUND_REQUEST;
      case JdpiPixInfractionType.CANCEL_DEVOLUTION:
        return PixInfractionType.CANCEL_DEVOLUTION;
      default:
        throw new JdpiPixInfractionTypeException(infractionType);
    }
  }

  /**
   * Convert enum JdpiPixInfractionStatus to PixInfractionStatus.
   *
   * @param jdpiPixInfractionStatus JdpiPixInfractionStatus to be converted to PixInfractionStatus ENUM.
   * @returns Returns the PixInfractionStatus ENUM.
   */
  static getInfractionStatus(
    jdpiPixInfractionStatus: JdpiPixInfractionStatus,
  ): PixInfractionStatus {
    switch (jdpiPixInfractionStatus) {
      case JdpiPixInfractionStatus.OPEN:
        return PixInfractionStatus.OPEN;
      case JdpiPixInfractionStatus.ACKNOWLEDGED:
        return PixInfractionStatus.ACKNOWLEDGED;
      case JdpiPixInfractionStatus.CANCELLED:
        return PixInfractionStatus.CANCELLED;
      case JdpiPixInfractionStatus.CLOSED:
        return PixInfractionStatus.CLOSED;
      default:
        throw new JdpiPixInfractionStatusException(jdpiPixInfractionStatus);
    }
  }

  /**
   * Convert enum PixInfractionReport to JdpiPixInfractionReport.
   *
   * @param reportBy PixInfractionReport to be converted to JDPI ENUM.
   * @returns Returns JDPI ENUM.
   */
  static parseInfractionReportBy(
    reportBy: PixInfractionReport,
  ): JdpiPixInfractionReport {
    switch (reportBy) {
      case PixInfractionReport.CREDITED_PARTICIPANT:
        return JdpiPixInfractionReport.CREDITED_PARTICIPANT;
      case PixInfractionReport.DEBITED_PARTICIPANT:
        return JdpiPixInfractionReport.DEBITED_PARTICIPANT;
      default:
        throw new JdpiPixInfractionReportException(reportBy);
    }
  }

  /**
   * Convert enum PixRefundStatus to JdpiPixRefundStatus.
   *
   * @param status PixRefundStatus to be converted to JdpiPixRefundStatus.
   * @returns Returns the JdpiPixRefundStatus.
   */
  static parsePixRefundStatusToJdpiPixRefundStatus(
    status: PixRefundStatus,
  ): JdpiPixRefundStatus {
    switch (status) {
      case PixRefundStatus.OPEN:
        return JdpiPixRefundStatus.OPEN;
      case PixRefundStatus.CANCELLED:
        return JdpiPixRefundStatus.CANCELLED;
      case PixRefundStatus.CLOSED:
        return JdpiPixRefundStatus.CLOSED;
      default:
        throw new JdpiInvalidPixRefundStatusException(status);
    }
  }

  /**
   * Convert enum JdpiPixInfractionReport to PixInfractionReport.
   *
   * @param jdpiReportBy JdpiPixInfractionReport to be converted to PixInfractionReport ENUM.
   * @returns Returns the PixInfractionReport ENUM.
   */
  static getInfractionReportBy(
    jdpiReportBy: JdpiPixInfractionReport,
  ): PixInfractionReport {
    switch (jdpiReportBy) {
      case JdpiPixInfractionReport.CREDITED_PARTICIPANT:
        return PixInfractionReport.CREDITED_PARTICIPANT;
      case JdpiPixInfractionReport.DEBITED_PARTICIPANT:
        return PixInfractionReport.DEBITED_PARTICIPANT;
      default:
        throw new JdpiPixInfractionReportException(jdpiReportBy);
    }
  }

  /**
   * Convert enum JdpiPixRefundReasonType to PixRefundReason.
   *
   * @param reason JdpiPixRefundReasonType to be converted to PixRefundReason.
   * @returns Returns the PixRefundReason.
   */
  static parseJdpiPixRefundReasonTypeToPixRefundReason(
    reason: JdpiPixRefundReasonType,
  ): PixRefundReason {
    switch (reason) {
      case JdpiPixRefundReasonType.FRAUD:
        return PixRefundReason.FRAUD;
      case JdpiPixRefundReasonType.PSP_ERROR:
        return PixRefundReason.OPERATIONAL_FLAW;
      case JdpiPixRefundReasonType.CANCELLED:
        return PixRefundReason.REFUND_CANCELLED;
      default:
        throw new JdpiInvalidPixRefundReasonTypeException(reason);
    }
  }

  /**
   * Convert enum PixInfractionAnalysisResultType to JdpiPixInfractionAnalysisResultTypeType.
   *
   * @param analysisResultType PixInfractionAnalysisResultType to be converted to JDPI ENUM.
   * @returns Returns JDPI ENUM.
   */
  static parseInfractionAnalysisResultType(
    analysisResultType: PixInfractionAnalysisResultType,
  ): JdpiPixInfractionAnalysisResultType {
    switch (analysisResultType) {
      case PixInfractionAnalysisResultType.AGREED:
        return JdpiPixInfractionAnalysisResultType.AGREED;
      case PixInfractionAnalysisResultType.DISAGREED:
        return JdpiPixInfractionAnalysisResultType.DISAGREED;
      default:
        throw new JdpiPixInfractionaAnalysisResultTypeException(
          analysisResultType,
        );
    }
  }

  /**
   * Convert enum JdpiPixInfractionAnalysisResultType to PixInfractionAnalysisResultType.
   *
   * @param jdpiReportBy JdpiPixInfractionAnalysisResultType to be converted to PixInfractionAnalysisResultType ENUM.
   * @returns Returns the PixInfractionAnalysisResultType ENUM.
   */
  static getInfractionAnalysisResultType(
    analysisResultType: JdpiPixInfractionAnalysisResultType,
  ): PixInfractionAnalysisResultType {
    switch (analysisResultType) {
      case JdpiPixInfractionAnalysisResultType.AGREED:
        return PixInfractionAnalysisResultType.AGREED;
      case JdpiPixInfractionAnalysisResultType.DISAGREED:
        return PixInfractionAnalysisResultType.DISAGREED;
      default:
        throw new JdpiPixInfractionaAnalysisResultTypeException(
          analysisResultType,
        );
    }
  }

  /**
   * Convert enum JdpiPixRefundParticipant to PixRefundType.
   *
   * @param type JdpiPixRefundParticipant to be converted to PixRefundType.
   * @returns Returns the PixRefundType.
   */
  static parsePixRefundType(type: JdpiPixRefundParticipant): PixRefundType {
    switch (type) {
      case JdpiPixRefundParticipant.REQUESTING:
        return PixRefundType.REQUESTING;
      case JdpiPixRefundParticipant.CONTESTED:
        return PixRefundType.CONTESTED;
      default:
        throw new JdpiInvalidPixRefundTypeException(type);
    }
  }

  /**
   * Convert enum JdpiPixRefundStatus to PixRefundStatus.
   *
   * @param reason JdpiPixRefundStatus to be converted to PixRefundStatus.
   * @returns Returns the PixRefundStatus.
   */
  static parsePixRefundStatus(status: JdpiPixRefundStatus): PixRefundStatus {
    switch (status) {
      case JdpiPixRefundStatus.OPEN:
        return PixRefundStatus.OPEN;
      case JdpiPixRefundStatus.CLOSED:
        return PixRefundStatus.CLOSED;
      case JdpiPixRefundStatus.CANCELLED:
        return PixRefundStatus.CANCELLED;
      default:
        throw new JdpiInvalidPixRefundStatusException(status);
    }
  }

  /**
   * Convert enum JdpiPixRefundRejectionReason to PixRefundRejectionReason.
   *
   * @param reason JdpiPixRefundRejectionReason to be converted to PixRefundRejectionReason.
   * @returns Returns the PixRefundRejectionReason.
   */
  static parsePixRefundPixRefundRejectionReason(
    status: JdpiPixRefundRejectionReason,
  ): PixRefundRejectionReason {
    switch (status) {
      case JdpiPixRefundRejectionReason.ACCOUNT_CLOSURE:
        return PixRefundRejectionReason.ACCOUNT_CLOSURE;
      case JdpiPixRefundRejectionReason.NOT_ENOUGH_BALANCE:
        return PixRefundRejectionReason.NO_BALANCE;
      case JdpiPixRefundRejectionReason.ANOTHER_REASON:
        return PixRefundRejectionReason.OTHER;
      default:
        throw new JdpiInvalidPixRefundRejectionReasonException(status);
    }
  }

  /**
   * Convert enum PixRefundStatus to JdpiPixRefundAnalysisResult.
   *
   * @param status PixRefundStatus to be converted to JdpiPixRefundAnalysisResult.
   * @returns Returns the JdpiPixRefundAnalysisResult.
   */
  static parseJdpiPixRefundAnalysisResult(
    status: PixRefundStatus,
  ): JdpiPixRefundAnalysisResult {
    switch (status) {
      case PixRefundStatus.CLOSED:
        return JdpiPixRefundAnalysisResult.TOTALLY_AGREED;
      case PixRefundStatus.CANCELLED:
        return JdpiPixRefundAnalysisResult.REJECTED;
      default:
        throw new JdpiInvalidPixRefundAnalysisResultException(status);
    }
  }

  /**
   * Convert enum PixRefundRejectionReason to JdpiPixRefundRejectionReason.
   *
   * @param status PixRefundRejectionReason to be converted to JdpiPixRefundRejectionReason.
   * @returns Returns the JdpiPixRefundRejectionReason.
   */
  static parseJdpiPixRefundRejectionReason(
    rejectionReason: PixRefundRejectionReason,
  ): JdpiPixRefundRejectionReason {
    switch (rejectionReason) {
      case PixRefundRejectionReason.ACCOUNT_CLOSURE:
        return JdpiPixRefundRejectionReason.ACCOUNT_CLOSURE;
      case PixRefundRejectionReason.CANNOT_REFUND:
      case PixRefundRejectionReason.OTHER:
        return JdpiPixRefundRejectionReason.ANOTHER_REASON;
      case PixRefundRejectionReason.NO_BALANCE:
        return JdpiPixRefundRejectionReason.NOT_ENOUGH_BALANCE;
      default:
        throw new JdpiInvalidPixRefundRejectionReasonException(rejectionReason);
    }
  }

  /**
   * Convert JdpiPixRefundAnalysisResult to string.
   *
   * @param analysisResult JdpiPixRefundAnalysisResult.
   * @returns Returns the analysis result in string.
   */
  static parseAnalysisResult(
    analysisResult: JdpiPixRefundAnalysisResult,
  ): string {
    switch (analysisResult) {
      case JdpiPixRefundAnalysisResult.TOTALLY_AGREED:
        return 'Totally Agreed';
      case JdpiPixRefundAnalysisResult.PARTIALLY_AGREED:
        return 'Partially Agreed';
      case JdpiPixRefundAnalysisResult.REJECTED:
        return 'Rejected';
      default:
        throw new JdpiInvalidPixRefundAnalysisResultException(analysisResult);
    }
  }

  /**
   * Convert enum JdpiPaymentStatus to PaymentStatusType.
   *
   * @param status The source status from JdpiPaymentStatus enum.
   * @returns Returns the corresponding PaymentStatusType.
   */
  static parsePaymentStatusType(status: JdpiPaymentStatus): PaymentStatusType {
    switch (status) {
      case JdpiPaymentStatus.SETTLED:
        return PaymentStatusType.SETTLED;
      case JdpiPaymentStatus.PROCESSING:
        return PaymentStatusType.PROCESSING;
      case JdpiPaymentStatus.ERROR_WHILE_PROCESSING:
        return PaymentStatusType.CHARGEBACK;

      default:
        throw new JdpiPaymentStatusTypeException(status);
    }
  }

  /**
   * Convert enum JdpiFinalityType to string.
   *
   * @param reason The source reason from JdpiFinalityType enum.
   * @returns Returns the corresponding string.
   */
  static parsePaymentReason(reason: JdpiFinalityType): string {
    switch (reason) {
      case JdpiFinalityType.PIX_TRANSFER:
        return 'Buy or Pix Transfer.';
      case JdpiFinalityType.PIX_CHANGE:
        return 'Pix Change.';
      case JdpiFinalityType.PIX_WITHDRAWAL:
        return 'Pix Withdrawal.';

      default:
        throw new JdpiFinalityTypeException(reason);
    }
  }

  /**
   * Convert enum ResultType to JdpiResultType.
   *
   * @param resultType ResultType to be converted to JdpiResultType.
   * @returns Returns the Jdpi Result Type.
   */
  static parseResultType(resultType: ResultType): JdpiResultType {
    switch (resultType) {
      case ResultType.INVALID:
        return JdpiResultType.INVALID;
      case ResultType.VALID:
        return JdpiResultType.VALID;
      default:
        throw new JdpiResultTypeException(resultType);
    }
  }

  /**
   * Convert enum PixFraudDetectionType to JdpiPixInfractionFraudType.
   *
   * @param fraudType PixFraudDetectionType to be converted to JdpiPixInfractionFraudType.
   * @returns Returns the JdpiPixInfractionFraudType.
   */
  static parseFraudType(
    fraudType: PixFraudDetectionType,
  ): JdpiPixInfractionFraudType {
    switch (fraudType) {
      case PixFraudDetectionType.DUMMY_ACCOUNT:
        return JdpiPixInfractionFraudType.DUMMY_ACCOUNT;
      case PixFraudDetectionType.FALSE_IDENTIFICATION:
        return JdpiPixInfractionFraudType.FALSE_IDENTIFICATION;
      case PixFraudDetectionType.FRAUDSTER_ACCOUNT:
        return JdpiPixInfractionFraudType.FRAUDSTER_ACCOUNT;
      case PixFraudDetectionType.OTHER:
        return JdpiPixInfractionFraudType.OTHER;
      case PixFraudDetectionType.UNKNOWN:
        return JdpiPixInfractionFraudType.UNKNOWN;
      default:
        throw new JdpiFraudDetectionTypeException(fraudType);
    }
  }

  /**
   * Convert enum JdpiPixFraudDetectionType to PixInfractionFraudType.
   *
   * @param fraudType JdpiPixFraudDetectionType to be converted to PixInfractionFraudType.
   * @returns Returns the PixInfractionFraudType.
   */
  static getFraudType(
    fraudType: JdpiPixInfractionFraudType,
  ): PixFraudDetectionType {
    switch (fraudType) {
      case JdpiPixInfractionFraudType.DUMMY_ACCOUNT:
        return PixFraudDetectionType.DUMMY_ACCOUNT;
      case JdpiPixInfractionFraudType.FALSE_IDENTIFICATION:
        return PixFraudDetectionType.FALSE_IDENTIFICATION;
      case JdpiPixInfractionFraudType.FRAUDSTER_ACCOUNT:
        return PixFraudDetectionType.FRAUDSTER_ACCOUNT;
      case JdpiPixInfractionFraudType.OTHER:
        return PixFraudDetectionType.OTHER;
      case JdpiPixInfractionFraudType.UNKNOWN:
        return PixFraudDetectionType.UNKNOWN;
      default:
        throw new JdpiFraudDetectionTypeException(fraudType);
    }
  }

  /**
   * Convert enum JdpiFraudDetectionStatus to PixFraudDetectionStatus.
   *
   * @param fraudType JdpiFraudDetectionStatus to be converted to PixFraudDetectionStatus.
   * @returns Returns the PixFraudDetectionStatus.
   */
  static parseFraudDetectionStatus(
    status: JdpiFraudDetectionStatus,
  ): PixFraudDetectionStatus {
    switch (status) {
      case JdpiFraudDetectionStatus.REGISTERED:
        return PixFraudDetectionStatus.REGISTERED;
      case JdpiFraudDetectionStatus.CANCELED:
        return PixFraudDetectionStatus.CANCELED_REGISTERED;
      default:
        throw new JdpiFraudDetectionStatusException(status);
    }
  }

  /**
   * Convert enum FraudDetectionStatus to JdpiPixFraudDetectionStatus.
   *
   * @param fraudType FraudDetectionStatus to be converted to JdpiPixFraudDetectionStatus.
   * @returns Returns the JdpiPixFraudDetectionStatus.
   */
  static getFraudDetectionStatus(
    status: PixFraudDetectionStatus,
  ): JdpiFraudDetectionStatus {
    switch (status) {
      case PixFraudDetectionStatus.REGISTERED:
        return JdpiFraudDetectionStatus.REGISTERED;
      case PixFraudDetectionStatus.CANCELED_REGISTERED:
        return JdpiFraudDetectionStatus.CANCELED;
      default:
        throw new JdpiFraudDetectionStatusException(status);
    }
  }
}
