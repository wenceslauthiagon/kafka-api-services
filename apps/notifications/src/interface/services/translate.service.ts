import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
  WarningPixDeposit,
} from '@zro/pix-payments/domain';

export type TranslateResponse = {
  message: string;
  title: string;
};

export interface TranslateService {
  translatePixPaymentState(payment: Payment): Promise<TranslateResponse>;

  translatePixDepositState(pixDeposit: PixDeposit): Promise<TranslateResponse>;

  translatePixDevolutionState(
    pixDevolution: PixDevolution,
  ): Promise<TranslateResponse>;

  translatePixDevolutionReceivedState(
    pixDevolutionReceived: PixDevolutionReceived,
  ): Promise<TranslateResponse>;

  translateWarningPixDepositState(
    warningPixDeposit: WarningPixDeposit,
    amount: number,
    thirdPartName: string,
  ): Promise<TranslateResponse>;
}
