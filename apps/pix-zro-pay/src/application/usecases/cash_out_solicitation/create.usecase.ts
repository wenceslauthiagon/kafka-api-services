import { Logger } from 'winston';
import {
  BankAccountRepository,
  CashOutSolicitation,
  CashOutSolicitationEntity,
  CashOutSolicitationRepository,
  CompanyRepository,
  CashOutSolicitationStatus,
  UserRepository,
} from '@zro/pix-zro-pay/domain';
import {
  CompanyNotFoundException,
  CompanyWithoutActiveBankCashOutException,
  UserNotFoundException,
} from '@zro/pix-zro-pay/application';

export class CreateCashOutSolicitationUseCase {
  constructor(
    private logger: Logger,
    private readonly cashOutSolicitationRepository: CashOutSolicitationRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({
      context: CreateCashOutSolicitationUseCase.name,
    });
  }

  async execute(
    valueCents: number,
    paymentDate: Date,
    responsibleUserObservation: string,
    providerHolderName: string,
    providerHolderCnpj: string,
    providerBankName: string,
    providerBankBranch: string,
    providerBankAccountNumber: string,
    providerBankIspb: string,
    providerBankAccountType: string,
    financialEmail: string,
    companyId: number,
  ): Promise<CashOutSolicitation> {
    const companyFound = await this.companyRepository.getById(companyId);

    this.logger.debug('Company Found.', { company: companyFound });

    if (!companyFound) {
      throw new CompanyNotFoundException(companyFound);
    }

    if (!companyFound.activeBankForCashOut?.id) {
      throw new CompanyWithoutActiveBankCashOutException(companyFound);
    }

    const bankAccountFound = await this.bankAccountRepository.getById(
      companyFound.activeBankForCashOut.id,
    );

    this.logger.debug('BankAccount Found.', { bankAccount: bankAccountFound });

    const userFound = await this.userRepository.getById(
      companyFound.responsible.id,
    );

    if (!userFound) {
      throw new UserNotFoundException(userFound);
    }

    const newCashOutSolicitation = new CashOutSolicitationEntity({
      valueCents,
      paymentDate,
      financialEmail,
      responsibleUserObservation,
      providerHolderName,
      providerHolderCnpj,
      providerBankName,
      providerBankBranch,
      providerBankAccountNumber,
      providerBankIspb,
      providerBankAccountType,
      company: companyFound,
      bankAccount: bankAccountFound,
      status: CashOutSolicitationStatus.PENDING,
      requesterUserId: userFound.id,
    });

    await this.cashOutSolicitationRepository.create(newCashOutSolicitation);

    this.logger.debug('CashOut Solicitation Found.', {
      cashOutSolicitation: newCashOutSolicitation,
    });

    return newCashOutSolicitation;
  }
}
