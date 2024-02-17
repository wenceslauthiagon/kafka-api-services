import { Test, TestingModule } from '@nestjs/testing';
import { ConversionModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ConversionFactory } from '@zro/test/otc/config';

describe('Conversion', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const conversion = await ConversionFactory.create<ConversionModel>(
      ConversionModel.name,
    );
    expect(conversion).toBeDefined();
    expect(conversion.id).toBeDefined();
  });

  afterAll(() => module.close());
});
