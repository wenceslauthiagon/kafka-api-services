import { Test, TestingModule } from '@nestjs/testing';
import { PixDevolutionModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('PixDevolutionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const deposit = await PixDevolutionFactory.create<PixDevolutionModel>(
      PixDevolutionModel.name,
    );

    expect(deposit).toBeDefined();
    expect(deposit.id).toBeDefined();
    expect(deposit.userId).toBeDefined();
    expect(deposit.operationId).toBeDefined();
    expect(deposit.depositId).toBeDefined();
    expect(deposit.description).toBeDefined();
    expect(deposit.devolutionCode).toBeDefined();
    expect(deposit.failedMessage).toBeDefined();
    expect(deposit.amount).toBeDefined();
    expect(deposit.state).toBeDefined();
    expect(deposit.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
