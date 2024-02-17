import { Test, TestingModule } from '@nestjs/testing';
import { HolidayModel } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('HolidayModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const holiday = await HolidayFactory.create<HolidayModel>(
      HolidayModel.name,
    );
    expect(holiday).toBeDefined();
    expect(holiday.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
