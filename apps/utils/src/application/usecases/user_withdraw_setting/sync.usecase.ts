import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
  WithdrawFilter,
  WithdrawSettingType,
} from '@zro/utils/domain';
import { PaymentEntity } from '@zro/pix-payments/domain';
import { DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import { CurrencyEntity, TransactionType } from '@zro/operations/domain';
import {
  OperationService,
  PixKeyService,
  PixPaymentService,
} from '@zro/utils/application';

export class SyncUserWithdrawSettingUseCase {
  private BRL_TRANSACTION_TYPES = ['PIXSEND'];

  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRepository: UserWithdrawSettingRepository,
    private readonly operationService: OperationService,
    private readonly pixKeyService: PixKeyService,
    private readonly pixPaymentService: PixPaymentService,
    private readonly pixPaymentOperationCurrencyTag: string,
  ) {
    this.logger = logger.child({
      context: SyncUserWithdrawSettingUseCase.name,
    });
  }

  async execute(withdrawFilter: WithdrawFilter) {
    this.checkFilter(withdrawFilter);

    const usersWithdrawsSettings =
      await this.getUsersWithdrawsSettings(withdrawFilter);

    for (const userWithdrawSetting of usersWithdrawsSettings) {
      if (this.isBrl(userWithdrawSetting.transactionType.tag)) {
        const currency = new CurrencyEntity({
          tag: this.pixPaymentOperationCurrencyTag,
        });

        const walletAccount =
          await this.operationService.getWalletAccountByWalletAndCurrency(
            userWithdrawSetting.wallet,
            currency,
          );

        const canWithdraw =
          walletAccount.balance >= userWithdrawSetting.balance;

        if (!canWithdraw) {
          this.logger.debug('Not is possible withdraw.', {
            walletAccountBalance: walletAccount.balance,
            userWithdrawSettingBalance: userWithdrawSetting.balance,
          });

          continue;
        }

        await this.pixPaymentWithdraw(userWithdrawSetting);

        continue;
      }

      this.logger.debug('Transaction type not implemented.', {
        transactionType: userWithdrawSetting.transactionType,
      });
    }
  }

  private checkFilter(withdrawFilter: WithdrawFilter) {
    if (!withdrawFilter?.type) {
      throw new MissingDataException(['Type']);
    }

    if (
      withdrawFilter?.type === WithdrawSettingType.MONTHLY &&
      !withdrawFilter.day
    ) {
      throw new MissingDataException(['Day']);
    }

    if (
      withdrawFilter?.type === WithdrawSettingType.WEEKLY &&
      !withdrawFilter.weekDay
    ) {
      throw new MissingDataException(['Week day']);
    }
  }

  private async getUsersWithdrawsSettings(withdrawFilter: WithdrawFilter) {
    const usersWithdrawsSettings =
      await this.userWithdrawSettingRepository.getAllActiveByFilter(
        withdrawFilter,
      );

    this.logger.debug('Users withdraws settings found.', {
      usersWithdrawsSettings,
    });

    return usersWithdrawsSettings;
  }

  private isBrl(tag: TransactionType['tag']) {
    return this.BRL_TRANSACTION_TYPES.includes(tag);
  }

  private async pixPaymentWithdraw(userWithdrawSetting: UserWithdrawSetting) {
    const decodedPixKey = new DecodedPixKeyEntity({
      id: uuidV4(),
      user: userWithdrawSetting.user,
      key: userWithdrawSetting.pixKey.key,
      type: userWithdrawSetting.pixKey.type,
    });

    const decodedPixKeyCreated =
      await this.pixKeyService.createDecoded(decodedPixKey);

    this.logger.debug('Decoded pix key created.', { decodedPixKey });

    const payment = new PaymentEntity({
      id: uuidV4(),
      user: userWithdrawSetting.user,
      value: userWithdrawSetting.balance,
      decodedPixKey: decodedPixKeyCreated,
      description: 'Saque automático',
    });

    await this.pixPaymentService.createByPixKey(
      userWithdrawSetting.wallet,
      payment,
    );
  }
}
