import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWalletRepository,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  AcceptWalletInvitationMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  WalletInvitationDatabaseRepository,
  WalletInvitationModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletInvitationFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';
import { AcceptWalletInvitationRequest } from '@zro/operations/interface';

describe('AcceptWalletInvitationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletInvitationRepository: WalletInvitationRepository;
  let userWalletRepository: UserWalletRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletInvitationRepository = new WalletInvitationDatabaseRepository();
    userWalletRepository = new UserWalletDatabaseRepository();
  });

  describe('AcceptWalletInvitation', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not accept with invalid parameters', async () => {
        const message: AcceptWalletInvitationRequest = {
          id: uuidV4(),
          confirmCode: null,
          userId: null,
          email: null,
        };

        await expect(() =>
          controller.execute(
            walletInvitationRepository,
            userWalletRepository,
            logger,
            message,
            ctx,
          ),
        ).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should accept wallet invitation successfully', async () => {
        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationModel>(
            WalletInvitationModel.name,
            { state: WalletInvitationState.PENDING },
          );

        const { id, email, confirmCode, userId, walletId } = walletInvitation;

        const message: AcceptWalletInvitationRequest = {
          id: walletInvitation.id,
          confirmCode,
          userId,
          email,
        };

        const result = await controller.execute(
          walletInvitationRepository,
          userWalletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.email).toBe(email);
        expect(result.value.state).toBe(WalletInvitationState.ACCEPTED);
        expect(result.value.walletId).toBe(walletId);
        expect(result.value.permissionTypeTags).toHaveLength(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
