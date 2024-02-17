import { Test, TestingModule } from '@nestjs/testing';
import { CryptoReportModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { CryptoReportFactory } from '@zro/test/otc/config';

describe('Crypto report', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const report = await CryptoReportFactory.create<CryptoReportModel>(
      CryptoReportModel.name,
    );
    expect(report).toBeDefined();
    expect(report.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
