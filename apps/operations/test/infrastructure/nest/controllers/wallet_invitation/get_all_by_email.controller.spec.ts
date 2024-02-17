import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  GetAllWalletInvitationByEmailMicroserviceController as Controller,
  WalletInvitationDatabaseRepository,
  WalletInvitationModel,
} from '@zro/operations/infrastructure';
import { GetAllWalletInvitationByEmailRequest } from '@zro/operations/interface';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletInvitationFactory } from '@zro/test/operations/config';

describe('GetAllWalletInvitationByEmailMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletInvitationRepository: WalletInvitationRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletInvitationRepository = new WalletInvitationDatabaseRepository();
  });

  describe('GetAllWalletInvitation', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not decline with invalid parameters', async () => {
        const message: GetAllWalletInvitationByEmailRequest = {
          email: null,
          state: null,
        };

        await expect(() =>
          controller.execute(walletInvitationRepository, logger, message, ctx),
        ).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should get all wallet invitations successfully', async () => {
        const email = faker.internet.email();
        const state = WalletInvitationState.ACCEPTED;

        await WalletInvitationFactory.createMany<WalletInvitationModel>(
          WalletInvitationModel.name,
          2,
          { state, email },
        );

        await WalletInvitationFactory.createMany<WalletInvitationModel>(
          WalletInvitationModel.name,
          2,
          { state: WalletInvitationState.EXPIRED, email },
        );

        const message: GetAllWalletInvitationByEmailRequest = {
          email,
        };

        const result = await controller.execute(
          walletInvitationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(1);
        expect(result.value.total).toBe(2);
        expect(result.value.pageTotal).toBe(1);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.state).toBe(state);
          expect(res.email).toBe(email);
          expect(res.walletId).toBeDefined();
          expect(res.permissionTypeTags).toHaveLength(1);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
