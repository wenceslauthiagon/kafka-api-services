import {
  AccountType,
  PixAgentMod,
  PaymentPriorityType,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';
import {
  InitiationType,
  PaymentPriorityLevelType,
  ValueType,
  ResultType,
} from '@zro/api-jdpi/domain';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiPaymentType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiValueType,
  JdpiResultType,
} from '@zro/jdpi/domain';
import {
  JdpiAccountTypeException,
  JdpiInitiationTypeException,
  JdpiAgentModalityTypeException,
  JdpiPersonTypeException,
  JdpiPaymentPriorityTypeException,
  JdpiPaymentPriorityLevelTypeException,
  JdpiValueTypeException,
  JdpiResultTypeException,
} from '@zro/jdpi';

export class Parse {
  /**
   * Convert enum JdpiPaymentType to InitiationType.
   *
   * @param jdpiPaymentType JdpiPaymentType to be converted to InitiationType.
   * @returns Returns InitiationType.
   */
  static getInitiationType(jdpiPaymentType: JdpiPaymentType): InitiationType {
    switch (jdpiPaymentType) {
      case JdpiPaymentType.MANUAL:
        return InitiationType.MANUAL;
      case JdpiPaymentType.KEY:
        return InitiationType.KEY;
      case JdpiPaymentType.QRCODE_STATIC:
        return InitiationType.QRCODE_STATIC;
      case JdpiPaymentType.QRCODE_DYNAMIC:
        return InitiationType.QRCODE_DYNAMIC;
      case JdpiPaymentType.PAYMENT_SERVICE:
        return InitiationType.PAYMENT_SERVICE;
      case JdpiPaymentType.QRCODE_PAID:
        return InitiationType.QRCODE_PAYER;
      default:
        throw new JdpiInitiationTypeException(jdpiPaymentType);
    }
  }

  /**
   * Convert enum JdpiPersonType to PersonType.
   *
   * @param jdpiPersonType JdpiPersonType to be converted to PersonType.
   * @returns Returns PersonType.
   */
  static getPersonType(jdpiPersonType: JdpiPersonType): PersonType {
    switch (jdpiPersonType) {
      case JdpiPersonType.NATURAL_PERSON:
        return PersonType.NATURAL_PERSON;
      case JdpiPersonType.LEGAL_PERSON:
        return PersonType.LEGAL_PERSON;
      default:
        throw new JdpiPersonTypeException(jdpiPersonType);
    }
  }

  /**
   * Convert enum PersonType to JdpiPersonType.
   *
   * @param personType PersonType to be converted to JdpiPersonType.
   * @returns Returns JdpiPersonType.
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
   * Convert enum JdpiAccount to TypeAccountType.
   *
   * @param jdpiAccountType JdpiAccountType to be converted to AccountType.
   * @returns Returns the AccountType.
   */
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
   * Convert enum JdpiPaymentPriorityType to PaymentPriorityType.
   *
   * @param jdpiPaymentPriorityType JdpiPaymentPriorityType to be converted to PaymentPriorityType.
   * @returns Returns the PaymentPriorityType.
   */
  static getPaymentPriorityType(
    jdpiPaymentPriorityType: JdpiPaymentPriorityType,
  ): PaymentPriorityType {
    switch (jdpiPaymentPriorityType) {
      case JdpiPaymentPriorityType.PRIORITY:
        return PaymentPriorityType.PRIORITY;
      case JdpiPaymentPriorityType.NOT_PRIORITY:
        return PaymentPriorityType.NOT_PRIORITY;

      default:
        throw new JdpiPaymentPriorityTypeException(jdpiPaymentPriorityType);
    }
  }

  /**
   * Convert enum JdpiPaymentPriorityLevelType to PaymentPriorityLevelType.
   *
   * @param jdpiPaymentPriorityLevelType JdpiPaymentPriorityLevelType to be converted to PaymentPriorityLevelType.
   * @returns Returns the PaymentPriorityLevelType.
   */
  static getPaymentPriorityLevelType(
    jdpiPaymentPriorityLevelType: JdpiPaymentPriorityLevelType,
  ): PaymentPriorityLevelType {
    switch (jdpiPaymentPriorityLevelType) {
      case JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT:
        return PaymentPriorityLevelType.PRIORITY_PAYMENT;
      case JdpiPaymentPriorityLevelType.PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS:
        return PaymentPriorityLevelType.PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS;
      case JdpiPaymentPriorityLevelType.SCHEDULED_PAYMENT:
        return PaymentPriorityLevelType.SCHEDULED_PAYMENT;
      default:
        throw new JdpiPaymentPriorityLevelTypeException(
          jdpiPaymentPriorityLevelType,
        );
    }
  }

  /**
   * Convert enum JdpiValueType to ValueType.
   *
   * @param jdpiValueType JdpiValueType to be converted to ValueType.
   * @returns Returns the ValueType.
   */
  static getValueType(jdpiValueType: JdpiValueType): ValueType {
    switch (jdpiValueType) {
      case JdpiValueType.RESOURCE:
        return ValueType.RESOURCE;
      case JdpiValueType.PURCHASE:
        return ValueType.PURCHASE;

      default:
        throw new JdpiValueTypeException(jdpiValueType);
    }
  }

  /**
   * Convert enum ResultType to JdpiResultType.
   *
   * @param resultType ResultType to be converted to JDPI ENUM.
   * @returns Returns the JDPI ENUM.
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
}
