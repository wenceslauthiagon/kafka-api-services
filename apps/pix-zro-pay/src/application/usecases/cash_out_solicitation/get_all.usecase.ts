import { Logger } from 'winston';
import {
  CashOutSolicitation,
  CashOutSolicitationRepository,
  CompanyRepository,
} from '@zro/pix-zro-pay/domain';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';

export class GetAllCashOutSolicitationUseCase {
  constructor(
    private logger: Logger,
    private readonly cashOutSolicitationRepository: CashOutSolicitationRepository,
    private readonly companyRepository: CompanyRepository,
  ) {
    this.logger = logger.child({
      context: GetAllCashOutSolicitationUseCase.name,
    });
  }

  async execute(
    pagination: Pagination,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
  ): Promise<TPaginationResponse<CashOutSolicitation>> {
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    const cashOutSolicitations =
      await this.cashOutSolicitationRepository.getAll(
        pagination,
        createdAtPeriodStart,
        createdAtPeriodEnd,
      );

    if (!cashOutSolicitations.data.length) {
      return cashOutSolicitations;
    }

    for (const cashOutSolicitation of cashOutSolicitations.data) {
      const company = await this.companyRepository.getById(
        cashOutSolicitation.company.id,
      );
      cashOutSolicitation.company = company;
    }

    this.logger.debug('CashOut Solicitations Found.', { cashOutSolicitations });

    return cashOutSolicitations;
  }
}
