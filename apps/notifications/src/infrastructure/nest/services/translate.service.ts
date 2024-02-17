import {
  formatToFloatValueReal,
  TranslateService as NestTranslateService,
} from '@zro/common';
import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
  WarningPixDeposit,
} from '@zro/pix-payments/domain';
import {
  TranslateResponse,
  TranslateService,
} from '@zro/notifications/interface';

export class TranslateI18nService implements TranslateService {
  constructor(private readonly translateService: NestTranslateService) {}

  async translatePixPaymentState(payment: Payment): Promise<TranslateResponse> {
    const formatted = {
      ...payment,
      formattedValue: formatToFloatValueReal(payment.value),
    };

    const message = await this.translateService.translate(
      'notifications',
      `PIX_PAYMENT_${payment.state}_MESSAGE`,
      formatted,
    );

    const title = await this.translateService.translate(
      'notifications',
      `PIX_PAYMENT_${payment.state}_TITLE`,
      formatted,
    );

    return { message, title };
  }

  async translatePixDepositState(
    pixDeposit: PixDeposit,
  ): Promise<TranslateResponse> {
    const formatted = {
      ...pixDeposit,
      formattedValue: formatToFloatValueReal(pixDeposit.amount),
    };

    const message = await this.translateService.translate(
      'notifications',
      `PIX_DEPOSIT_${pixDeposit.state}_MESSAGE`,
      formatted,
    );

    const title = await this.translateService.translate(
      'notifications',
      `PIX_DEPOSIT_${pixDeposit.state}_TITLE`,
      formatted,
    );

    return { message, title };
  }

  async translatePixDevolutionState(
    pixDevolution: PixDevolution,
  ): Promise<TranslateResponse> {
    const formatted = {
      ...pixDevolution,
      formattedValue: formatToFloatValueReal(pixDevolution.amount),
    };

    const message = await this.translateService.translate(
      'notifications',
      `PIX_DEVOLUTION_${pixDevolution.state}_MESSAGE`,
      formatted,
    );

    const title = await this.translateService.translate(
      'notifications',
      `PIX_DEVOLUTION_${pixDevolution.state}_TITLE`,
      formatted,
    );

    return { message, title };
  }

  async translatePixDevolutionReceivedState(
    pixDevolutionReceived: PixDevolutionReceived,
  ): Promise<TranslateResponse> {
    const formatted = {
      ...pixDevolutionReceived,
      formattedValue: formatToFloatValueReal(pixDevolutionReceived.amount),
    };

    const message = await this.translateService.translate(
      'notifications',
      `PIX_DEVOLUTION_RECEIVED_${pixDevolutionReceived.state}_MESSAGE`,
      formatted,
    );

    const title = await this.translateService.translate(
      'notifications',
      `PIX_DEVOLUTION_RECEIVED_${pixDevolutionReceived.state}_TITLE`,
      formatted,
    );

    return { message, title };
  }

  async translateWarningPixDepositState(
    warningPixDeposit: WarningPixDeposit,
    amount: number,
    thirdPartName: string,
  ): Promise<TranslateResponse> {
    const formatted = {
      ...warningPixDeposit,
      amount,
      thirdPartName,
      formattedValue: formatToFloatValueReal(amount),
    };

    const message = await this.translateService.translate(
      'notifications',
      `WARNING_PIX_DEPOSIT_${warningPixDeposit.state}_MESSAGE`,
      formatted,
    );

    const title = await this.translateService.translate(
      'notifications',
      `WARNING_PIX_DEPOSIT_${warningPixDeposit.state}_TITLE`,
      formatted,
    );

    return { message, title };
  }
}
