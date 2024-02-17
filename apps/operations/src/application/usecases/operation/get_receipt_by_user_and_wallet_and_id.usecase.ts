import { Logger } from 'winston';
import { ForbiddenException } from '@nestjs/common';
import {
  dateTimeFormat,
  formatDateAndTime,
  formatPersonDocument,
  formatPersonDocumentWithoutMask,
  formatToFloatValueReal,
  MissingDataException,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import {
  Operation,
  OperationRepository,
  Receipt,
  ReceiptEntity,
  TransactionTypeTag,
  UserWalletRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  BankingService,
  OperationNotFoundException,
  PixPaymentsService,
  UserService,
  WalletAccountsNotFoundException,
  OtcService,
  WalletNotFoundException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';

/**
 * Get receipt of operation by user and wallet and id.
 */
export class GetOperationReceiptByUserAndWalletAndIdUseCase {
  PIX_PAYMENTS_TAGS: string[] = [
    TransactionTypeTag.PIXCHANGE,
    TransactionTypeTag.PIXDEVREC,
    TransactionTypeTag.PIXDEVSEND,
    TransactionTypeTag.PIXREC,
    TransactionTypeTag.PIXREFUND,
    TransactionTypeTag.PIXREFUNDDEV,
    TransactionTypeTag.PIXSEND,
    TransactionTypeTag.PIXWITHDRAWL,
  ];
  BANKING_TAGS: string[] = ['TED'];
  OTC_TAGS: string[] = ['CONV'];
  OPERATIONS_TAGS: string[] = [
    TransactionTypeTag.P2PBT,
    TransactionTypeTag.WITHDRAW,
    TransactionTypeTag.GWDEB,
    TransactionTypeTag.GWCRED,
  ];

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param operationRepository Operation repository.
   * @param walletAccountCacheRepository WalletAccountCache repository.
   * @param pixPaymentsService Pix Payments service.
   * @param userService User service.
   * @param bankingService Banking service.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly walletRepository: WalletRepository,
    private readonly pixPaymentsService: PixPaymentsService,
    private readonly userService: UserService,
    private readonly bankingService: BankingService,
    private readonly otcService: OtcService,
  ) {
    this.logger = logger.child({
      context: GetOperationReceiptByUserAndWalletAndIdUseCase.name,
    });
  }

  /**
   * Get operation by wallet and user and di.
   * @param user User.
   * @param wallet Wallet.
   * @param id Operation id.
   * @returns Receipt of operation.
   */
  async execute(
    user: User,
    wallet: Wallet,
    id: Operation['id'],
  ): Promise<Receipt> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid || !id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User uuid'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    const userWallet = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('Wallet found.', { userWallet });

    if (!userWallet) {
      throw new ForbiddenException();
    }

    const walletAccounts =
      await this.walletAccountCacheRepository.getAllByWallet(userWallet.wallet);

    this.logger.debug('Wallets accounts found.', {
      length: walletAccounts.length,
    });

    if (!walletAccounts.length) {
      throw new WalletAccountsNotFoundException(wallet);
    }

    const operation = await this.operationRepository.getByWalletAccountsAndId(
      walletAccounts,
      id,
    );

    this.logger.debug('Operation found.', { operation });

    if (!operation) {
      throw new OperationNotFoundException(id);
    }

    const { transactionType } = operation;

    const isOperation = this.OPERATIONS_TAGS.includes(transactionType.tag);

    if (isOperation) {
      const owner =
        operation.owner?.id &&
        (await this.userService.getUserById(operation.owner.id));

      const beneficiary =
        operation.beneficiary?.id &&
        (await this.userService.getUserById(operation.beneficiary.id));

      operation.owner = owner ?? operation.owner;
      operation.beneficiary = beneficiary ?? operation.beneficiary;

      switch (transactionType.tag) {
        case TransactionTypeTag.P2PBT: {
          operation.ownerWalletAccount.wallet = await this.getOwnerWalletByUuid(
            userWallet.wallet.uuid,
          );

          operation.beneficiaryWalletAccount.wallet =
            await this.getBeneficiaryWalletByWalletAccount(
              operation.beneficiaryWalletAccount.id,
            );

          return this.generateP2PReceipt(operation);
        }

        case TransactionTypeTag.WITHDRAW: {
          return this.generateWithdrawReceipt(operation);
        }

        case TransactionTypeTag.GWDEB: {
          return this.generateGwdebReceipt(operation);
        }

        case TransactionTypeTag.GWCRED: {
          return this.generateGwcredReceipt(operation);
        }
      }
    }

    const isPaymentOperation = this.PIX_PAYMENTS_TAGS.includes(
      transactionType.tag,
    );

    if (isPaymentOperation) {
      const receipt = await this.pixPaymentsService.getPaymentReceipt(
        userWallet.user,
        userWallet.wallet,
        operation,
      );

      return receipt;
    }

    const isBankingOperation = this.BANKING_TAGS.includes(transactionType.tag);

    if (isBankingOperation) {
      const receipt = await this.bankingService.getBankingTedReceipt(
        userWallet.user,
        operation,
      );

      return receipt;
    }

    const isOtcOperation = this.OTC_TAGS.includes(transactionType.tag);

    if (isOtcOperation) {
      const receipt = await this.otcService.getOtcReceipt(
        userWallet.user,
        operation,
        operation.currency,
      );

      return receipt;
    }
  }

  private generateGwcredReceipt(operation: Operation): Receipt {
    const paymentData = [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              operation.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              operation.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              operation.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          formatPersonDocument(operation.beneficiary.document),
          {
            [ReceiptPortugueseTranslation.name]: operation.beneficiary.fullName,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: operation.owner.fullName },
          formatPersonDocument(operation.owner.document),
        ],
      },
    ];

    return new ReceiptEntity({
      paymentTitle: ReceiptPortugueseTranslation.p2pbt,
      paymentData,
      operationId: operation.id,
    });
  }

  private generateGwdebReceipt(operation: Operation): Receipt {
    const paymentData = [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              operation.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              operation.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              operation.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          formatPersonDocument(operation.beneficiary.document),
          {
            [ReceiptPortugueseTranslation.name]: operation.beneficiary.fullName,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: operation.owner.fullName },
          formatPersonDocument(operation.owner.document),
        ],
      },
    ];

    return new ReceiptEntity({
      paymentTitle: ReceiptPortugueseTranslation.p2pbt,
      paymentData,
      operationId: operation.id,
    });
  }

  private generateP2PReceipt(operation: Operation): Receipt {
    const paymentData = [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              operation.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              operation.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              operation.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          formatPersonDocument(operation.beneficiary.document),
          {
            [ReceiptPortugueseTranslation.name]: operation.beneficiary.fullName,
          },
          {
            [ReceiptPortugueseTranslation.walletName]:
              operation.beneficiaryWalletAccount.wallet.name,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: operation.owner.fullName },
          formatPersonDocument(operation.owner.document),
          {
            [ReceiptPortugueseTranslation.walletName]:
              operation.ownerWalletAccount.wallet.name,
          },
        ],
      },
    ];

    return new ReceiptEntity({
      paymentTitle: ReceiptPortugueseTranslation.p2pbt,
      paymentData,
      operationId: operation.id,
    });
  }

  private generateWithdrawReceipt(operation: Operation): Receipt {
    const paymentData = [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              operation.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              operation.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.sourceAccount]: [
          formatPersonDocumentWithoutMask(operation.owner.document),
          {
            [ReceiptPortugueseTranslation.name]: operation.owner.fullName,
          },
        ],
      },
    ];

    return new ReceiptEntity({
      paymentTitle: ReceiptPortugueseTranslation.withdraw,
      paymentData,
      operationId: operation.id,
    });
  }

  private async getOwnerWalletByUuid(walletUuid: string): Promise<Wallet> {
    const ownerWalletFound = await this.getWalletByUuid(walletUuid);

    this.logger.debug('Owner wallet found.', { ownerWalletFound });

    return ownerWalletFound;
  }

  private async getBeneficiaryWalletByWalletAccount(
    walletAccountId: number,
  ): Promise<Wallet> {
    const beneficiaryWalletAccount =
      await this.walletAccountCacheRepository.getById(walletAccountId);

    this.logger.debug('Beneficiary wallet account found.', {
      beneficiaryWalletAccount,
    });

    if (!beneficiaryWalletAccount?.wallet?.uuid) {
      throw new WalletAccountNotFoundException({ id: walletAccountId });
    }

    const beneficiaryWalletFound = await this.getWalletByUuid(
      beneficiaryWalletAccount.wallet.uuid,
    );

    this.logger.debug('Beneficiary wallet found.', { beneficiaryWalletFound });

    return beneficiaryWalletFound;
  }

  private async getWalletByUuid(uuid: string): Promise<Wallet> {
    const walletFound = await this.walletRepository.getByUuid(uuid);

    if (!walletFound) {
      throw new WalletNotFoundException({ uuid });
    }

    return walletFound;
  }
}
