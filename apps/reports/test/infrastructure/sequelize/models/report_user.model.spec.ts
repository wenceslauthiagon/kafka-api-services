import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportUserModel } from '@zro/reports/infrastructure';
import { ReportUserFactory } from '@zro/test/reports/config';

describe('ReportUserModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const report = await ReportUserFactory.create<ReportUserModel>(
      ReportUserModel.name,
    );

    expect(report.id).toBeDefined();
    expect(report.userId).toBeDefined();
    expect(report.fullName).toBeDefined();
    expect(report.phoneNumber).toBeDefined();
    expect(report.document).toBeDefined();
    expect(report.userUpdatedAt).toBeDefined();
    expect(report.state).toBeDefined();
    expect(report.email).toBeDefined();
    expect(report.addressStreet).toBeDefined();
    expect(report.addressNumber).toBeDefined();
    expect(report.addressCity).toBeDefined();
    expect(report.addressFederativeUnit).toBeDefined();
    expect(report.addressCountry).toBeDefined();
    expect(report.addressZipCode).toBeDefined();
    expect(report.onboardingUpdatedAt).toBeDefined();
    expect(report.adminName).toBeDefined();
    expect(report.dailyLimit).toBeDefined();
    expect(report.createdAt).toBeDefined();
    expect(report.updatedAt).toBeDefined();
  });

  afterAll(() => module.close());
});
