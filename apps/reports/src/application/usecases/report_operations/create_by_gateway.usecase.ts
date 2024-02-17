import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, Operation, TransactionType } from '@zro/operations/domain';
import {
  OperationType,
  ReportOperation,
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { OperationService, UserService } from '@zro/reports/application';
import { TransactionTypeNotFoundException } from '@zro/operations/application';
import { UserNotFoundException } from '@zro/users/application';

export class CreateReportOperationByGatewayUseCase {
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly operationService: OperationService,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: CreateReportOperationByGatewayUseCase.name,
    });
  }

  async execute(
    id: string,
    operation: Operation,
    operationType: OperationType,
    transactionType: TransactionType,
    thirdPart: User,
    thirdPartBankCode: string,
    thirdPartBranch: string,
    thirdPartAccountNumber: string,
    client: User,
    clientBankCode: string,
    clientBranch: string,
    clientAccountNumber: string,
    currency: Currency,
  ): Promise<ReportOperation> {
    // Data input check
    if (
      !operation?.id ||
      !operation?.createdAt ||
      !operation?.value ||
      !operationType ||
      !transactionType?.tag ||
      !thirdPart?.document ||
      !client?.document ||
      !clientBankCode ||
      !clientBranch ||
      !clientAccountNumber
    ) {
      throw new MissingDataException([
        ...(!operation?.id ? ['Operation ID'] : []),
        ...(!operation?.createdAt ? ['Operation Date'] : []),
        ...(!operation?.value ? ['Operation Value'] : []),
        ...(!operationType ? ['Operation Type'] : []),
        ...(!transactionType?.tag ? ['Transaction Tag'] : []),
        ...(!thirdPart?.document ? ['ThirdPart Document'] : []),
        ...(!client?.document ? ['Client Document'] : []),
        ...(!clientBankCode ? ['Client Bank Code'] : []),
        ...(!clientBranch ? ['Client Branch'] : []),
        ...(!clientAccountNumber ? ['Client Account Number'] : []),
      ]);
    }

    // Indepotent
    const reportOperation =
      await this.reportOperationRepository.getByOperation(operation);

    this.logger.debug('Check if report operation exists.', {
      reportOperation,
    });

    if (reportOperation) {
      return reportOperation;
    }

    const transactionTypeFound =
      await this.operationService.getTransactionTypeByTag(transactionType.tag);

    this.logger.debug('Transaction type found.', {
      transactionType: transactionTypeFound,
    });

    if (!transactionTypeFound) {
      throw new TransactionTypeNotFoundException({ tag: transactionType.tag });
    }

    const userFound = await this.userService.getUserByDocument(client.document);

    this.logger.debug('User found.', {
      user: userFound,
    });

    if (!userFound) {
      throw new UserNotFoundException({ document: client.document });
    }

    const newReportOperation = new ReportOperationEntity({
      id,
      operation,
      operationType,
      transactionType: transactionTypeFound,
      thirdPart,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      client: userFound,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currency,
    });

    await this.reportOperationRepository.create(newReportOperation);

    this.logger.debug('Added new report operation by gateway.', {
      reportOperation: newReportOperation,
    });

    return newReportOperation;
  }
}
