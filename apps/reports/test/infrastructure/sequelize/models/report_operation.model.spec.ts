import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportOperationModel } from '@zro/reports/infrastructure';
import { ReportOperationFactory } from '@zro/test/reports/config';

describe('ReportOperationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const report = await ReportOperationFactory.create<ReportOperationModel>(
      ReportOperationModel.name,
    );

    expect(report.id).toBeDefined();
    expect(report.operationId).toBeDefined();
    expect(report.operationDate).toBeDefined();
    expect(report.operationValue).toBeDefined();
    expect(report.operationType).toBeDefined();
    expect(report.transactionTypeId).toBeDefined();
    expect(report.transactionTypeTitle).toBeDefined();
    expect(report.transactionTypeTag).toBeDefined();
    expect(report.thirdPartName).toBeDefined();
    expect(report.thirdPartDocument).toBeDefined();
    expect(report.thirdPartDocumentType).toBeDefined();
    expect(report.thirdPartBankCode).toBeDefined();
    expect(report.thirdPartBranch).toBeDefined();
    expect(report.thirdPartAccountNumber).toBeDefined();
    expect(report.clientId).toBeDefined();
    expect(report.clientName).toBeDefined();
    expect(report.clientDocument).toBeDefined();
    expect(report.clientDocumentType).toBeDefined();
    expect(report.clientBankCode).toBeDefined();
    expect(report.clientBranch).toBeDefined();
    expect(report.clientAccountNumber).toBeDefined();
    expect(report.currencySymbol).toBeDefined();
    expect(report.createdAt).toBeDefined();
    expect(report.updatedAt).toBeDefined();
  });

  afterAll(() => module.close());
});
