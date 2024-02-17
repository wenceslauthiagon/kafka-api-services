import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import {
  JdpiAccountType,
  JdpiClaimParticipationFlow,
  JdpiClaimStatusType,
  JdpiClaimType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';

export const success = () => {
  const data = {
    dtHrJdPi: faker.date.past(),
    temMaisElementos: faker.datatype.boolean(),
    reivindicacoesAssociadas: [
      {
        tpReivindicacao: JdpiClaimType.OWNERSHIP,
        fluxoParticipacao: JdpiClaimParticipationFlow.DONOR,
        tpChave: JdpiKeyType.EMAIL,
        chave: faker.internet.email(),
        ispb: faker.datatype.number({ max: 9999 }),
        nrAgencia: faker.datatype
          .number({ min: 1, max: 9999 })
          .toString()
          .padStart(4, '0'),
        tpConta: JdpiAccountType.CACC,
        nrConta: faker.datatype
          .number({ max: 9999 })
          .toString()
          .padStart(8, '0'),
        dtHrAberturaConta: faker.date.past(),
        tpPessoa: JdpiPersonType.LEGAL_PERSON,
        cpfCnpj: Number(cnpj.generate()),
        ispbDoador: faker.datatype.number({ max: 9999 }),
        idReivindicacao: faker.datatype.uuid(),
        stReivindicacao: JdpiClaimStatusType.OPEN,
        dtHrLimiteResolucao: faker.date.future(),
        dtHrLimiteConclusao: faker.date.future(),
        dtHrUltModificacao: faker.date.past(),
      },
      {
        tpReivindicacao: JdpiClaimType.PORTABILITY,
        fluxoParticipacao: JdpiClaimParticipationFlow.DONOR,
        tpChave: JdpiKeyType.PHONE,
        chave: faker.phone.number(),
        ispb: faker.datatype.number({ max: 9999 }),
        nrAgencia: faker.datatype
          .number({ min: 1, max: 9999 })
          .toString()
          .padStart(4, '0'),
        tpConta: JdpiAccountType.CACC,
        nrConta: faker.datatype
          .number({ max: 9999 })
          .toString()
          .padStart(8, '0'),
        dtHrAberturaConta: faker.date.past(),
        tpPessoa: JdpiPersonType.NATURAL_PERSON,
        cpfCnpj: Number(cpf.generate()),
        ispbDoador: faker.datatype.number({ max: 9999 }),
        idReivindicacao: faker.datatype.uuid(),
        stReivindicacao: JdpiClaimStatusType.WAITING_RESOLUTION,
        dtHrLimiteResolucao: faker.date.future(),
        dtHrLimiteConclusao: faker.date.future(),
        dtHrUltModificacao: faker.date.past(),
      },
      {
        tpReivindicacao: JdpiClaimType.OWNERSHIP,
        fluxoParticipacao: JdpiClaimParticipationFlow.CLAIMANT,
        tpChave: JdpiKeyType.PHONE,
        chave: faker.phone.number(),
        ispb: faker.datatype.number({ max: 9999 }),
        nrAgencia: faker.datatype
          .number({ min: 1, max: 9999 })
          .toString()
          .padStart(4, '0'),
        tpConta: JdpiAccountType.CACC,
        nrConta: faker.datatype
          .number({ max: 9999 })
          .toString()
          .padStart(8, '0'),
        dtHrAberturaConta: faker.date.past(),
        tpPessoa: JdpiPersonType.NATURAL_PERSON,
        cpfCnpj: Number(cpf.generate()),
        ispbDoador: faker.datatype.number({ max: 9999 }),
        dadosDoador: {
          nrAgencia: faker.datatype
            .number({ min: 1, max: 9999 })
            .toString()
            .padStart(4, '0'),
          tpConta: JdpiAccountType.CACC,
          nrConta: faker.datatype
            .number({ max: 9999 })
            .toString()
            .padStart(8, '0'),
          tpPessoa: JdpiPersonType.LEGAL_PERSON,
          cpfCnpj: Number(cnpj.generate()),
          nome: faker.name.fullName(),
          nomeFantasia: faker.name.fullName(),
        },
        idReivindicacao: faker.datatype.uuid(),
        stReivindicacao: JdpiClaimStatusType.WAITING_RESOLUTION,
        dtHrLimiteResolucao: faker.date.future(),
        dtHrLimiteConclusao: faker.date.future(),
        dtHrUltModificacao: faker.date.past(),
      },
    ],
  };
  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const unexpectedError = () => {
  const error = {
    response: {
      data: {
        codigo: 'Unexpected Error',
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};
