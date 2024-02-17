import { Test, TestingModule } from '@nestjs/testing';
import { PixDevolutionReceivedModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';

describe('PixDevolutionReceivedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const devolutionReceived =
      await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
        PixDevolutionReceivedModel.name,
      );

    expect(devolutionReceived).toBeDefined();
    expect(devolutionReceived.id).toBeDefined();
    expect(devolutionReceived.userId).toBeDefined();
    expect(devolutionReceived.operationId).toBeDefined();
    expect(devolutionReceived.endToEndId).toBeDefined();
    expect(devolutionReceived.description).toBeDefined();
    expect(devolutionReceived.txId).toBeDefined();
    expect(devolutionReceived.amount).toBeDefined();
    expect(devolutionReceived.transactionOriginalId).toBeDefined();
    expect(devolutionReceived.clientBankIspb).toBeDefined();
    expect(devolutionReceived.clientBankName).toBeDefined();
    expect(devolutionReceived.clientBranch).toBeDefined();
    expect(devolutionReceived.endToEndId).toBeDefined();
    expect(devolutionReceived.description).toBeDefined();
    expect(devolutionReceived.transactionTag).toBeDefined();
    expect(devolutionReceived.createdAt).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
