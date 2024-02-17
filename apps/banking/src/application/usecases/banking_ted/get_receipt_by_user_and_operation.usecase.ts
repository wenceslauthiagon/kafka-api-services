import { Logger } from 'winston';
import {
  formatDateAndTime,
  formatToFloatValueReal,
  MissingDataException,
  ReceiptPortugueseTranslation,
  dateTimeFormat,
  formatPersonDocument,
} from '@zro/common';
import {
  BankingTed,
  BankingTedReceipt,
  BankingTedReceiptEntity,
  BankingTedRepository,
} from '@zro/banking/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { UserService } from '@zro/banking/application';

export class GetBankingTedReceiptByUserAndOperationUseCase {
  constructor(
    private logger: Logger,
    private bankingTedRepository: BankingTedRepository,
    private userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetBankingTedReceiptByUserAndOperationUseCase.name,
    });
  }

  /**
   * Get bankingTed by user and operation.
   *
   * @param user User.
   * @param operation Operation.
   * @returns The bankingTed receipt found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, operation: Operation): Promise<BankingTedReceipt> {
    if (!user?.uuid || !operation?.id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!operation?.id ? ['Operation'] : []),
      ]);
    }

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getByUserAndOperation(
      user,
      operation,
    );

    if (!bankingTed) return null;

    const userProps = await this.userService.getUserByUuid({ uuid: user.uuid });

    bankingTed.user = new UserEntity(userProps);

    this.logger.debug('BankingTed found.', { bankingTed });

    const receipt = this.generateReceipt(bankingTed);

    return receipt;
  }

  generateReceipt(bankingTed: BankingTed): BankingTedReceipt {
    if (!bankingTed.hasReceipt()) {
      return null;
    }

    const paymentData = [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              bankingTed.amount,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              bankingTed.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              bankingTed.operation.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              bankingTed.beneficiaryBankName,
          },
          formatPersonDocument(bankingTed.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: bankingTed.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: bankingTed.user.fullName },
          formatPersonDocument(bankingTed.user.document),
        ],
      },
    ];

    return new BankingTedReceiptEntity({
      paymentData,
      operationId: bankingTed.operation.id,
    });
  }
}
