import { Injectable } from '@nestjs/common';
import { ICieloService } from '@zro/cielo/application';
import {
  CieloCancelTransactionResponse,
  CieloCaptureTransactionResponse,
  CieloClientHttpService,
  CieloCreateAuthenticatedDebitTransactionRequest,
  CieloCreateAuthenticatedDebitTransactionResponse,
  CieloCreateCreditTransactionRequest,
  CieloCreateCreditTransactionResponse,
  CieloCreateNonAuthenticatedDebitTransactionRequest,
  CieloCreateNonAuthenticatedDebitTransactionResponse,
} from '@zro/cielo/infrastructure';
import { cieloConstants } from '@zro/cielo/interface';

@Injectable()
export class CieloService implements ICieloService {
  constructor(private readonly httpService: CieloClientHttpService) {}

  async createCreditTransaction(
    request: CieloCreateCreditTransactionRequest,
  ): Promise<CieloCreateCreditTransactionResponse> {
    request.Payment.Provider = cieloConstants.Payment.Provider;
    request.Payment.Country = cieloConstants.Payment.Country;
    request.Payment.Capture = cieloConstants.Payment.Capture;
    request.Payment.SaveCard = cieloConstants.Payment.SaveCard;
    request.Payment.Authenticate = cieloConstants.Payment.Authenticate;
    request.Payment.Recurrent = cieloConstants.Payment.Recurrent;
    request.Payment.SoftDescriptor = cieloConstants.Payment.SoftDescriptor;
    request.Payment.DoSplit = cieloConstants.Payment.DoSplit;
    request.Payment.Interest = cieloConstants.Payment.Interest;
    request.Payment.IniciatedTransactionIndicator =
      cieloConstants.Payment.IniciatedTransactionIndicator;
    request.Payment.Type = 'CreditCard';
    request.Payment.Installments = cieloConstants.Payment.Installments;

    return this.httpService.createCreditTransaction(request);
  }

  async createAuthenticatedDebitTransaction(
    request: CieloCreateAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateAuthenticatedDebitTransactionResponse> {
    return this.httpService.createAuthenticatedDebitTransaction(request);
  }

  async createNonAuthenticatedDebitTransaction(
    request: CieloCreateNonAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateNonAuthenticatedDebitTransactionResponse> {
    request.Payment.Provider = cieloConstants.Payment.Provider;
    request.Payment.Country = cieloConstants.Payment.Country;
    request.Payment.Capture = cieloConstants.Payment.Capture;
    request.Payment.Authenticate = cieloConstants.Payment.Authenticate;
    request.Payment.Recurrent = cieloConstants.Payment.Recurrent;
    request.Payment.SoftDescriptor = cieloConstants.Payment.SoftDescriptor;
    request.Payment.DoSplit = cieloConstants.Payment.DoSplit;
    request.Payment.Interest = cieloConstants.Payment.Interest;
    request.Payment.IniciatedTransactionIndicator =
      cieloConstants.Payment.IniciatedTransactionIndicator;
    request.Payment.Type = 'DebitCard';

    return this.httpService.createNonAuthenticatedDebitTransaction(request);
  }

  async getTransaction(
    paymentId: string,
  ): Promise<CieloCaptureTransactionResponse> {
    return this.httpService.getTransaction(paymentId);
  }

  async cancelTransaction(
    paymentId: string,
    amount: number,
  ): Promise<CieloCancelTransactionResponse> {
    return this.httpService.cancelTransaction(paymentId, amount);
  }
}
