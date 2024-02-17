import { faker } from '@faker-js/faker';
import { cnpj, cpf } from 'cpf-cnpj-validator';
import { getMoment } from '@zro/common';
import {
  JdpiAccountType,
  JdpiErrorTypes,
  JdpiFinalityType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentPriorityType,
  JdpiPaymentProcessSituation,
  JdpiPaymentStatus,
  JdpiPaymentType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import { generateRandomEndToEndId } from '@zro/test/jdpi/utils/generate_random_end_to_end_id.util';

export const success = () => {
  const value = faker.datatype.number({ min: 1, max: 99999 });
  const name = faker.name.fullName();

  return Promise.resolve({
    status: 200,
    data: {
      idReqJdPiConsultada: faker.datatype.uuid(),
      dtHrReqJdPi: getMoment().toISOString(),
      dtHrSituacao: getMoment().toISOString(),
      stJdPi: JdpiPaymentStatus.SETTLED,
      stJdPiProc: JdpiPaymentProcessSituation.SETTLED,
      endToEndId: generateRandomEndToEndId(),
      dtHrEfetivacao: getMoment().toISOString(),
      tpIniciacao: JdpiPaymentType.MANUAL,
      pagador: {
        ispb: 26264220,
        tpPessoa: JdpiPersonType.LEGAL_PERSON,
        cpfCnpj: cnpj.generate(),
        nome: faker.lorem.word(),
        nrAgencia: `${faker.datatype.number({ min: 0, max: 9999 })}`,
        tpConta: JdpiAccountType.PAYMENT_ACCOUNT,
        nrConta: `${faker.datatype.number({ min: 9999, max: 999999 })}`,
      },
      recebedor: {
        ispb: faker.datatype.number({ min: 9999999, max: 99999999 }),
        tpPessoa: JdpiPersonType.NATURAL_PERSON,
        cpfCnpj: cpf.generate(),
        nome: name,
        nrAgencia: `${faker.datatype.number({ min: 0, max: 9999 })}`,
        tpConta: JdpiAccountType.PAYMENT_ACCOUNT,
        nrConta: `${faker.datatype.number({ min: 9999, max: 999999 })}`,
      },
      prioridadePagamento: JdpiPaymentPriorityType.PRIORITY,
      tpPrioridadePagamento: JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT,
      finalidade: JdpiFinalityType.PIX_TRANSFER,
      valor: value,
      vlrDetalhe: [],
      infEntreClientes: `Pagamento de ${value} para ${name} (${cpf.generate()})`,
    },
  });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'Fake offline',
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

export const notFound = () => {
  const error = {
    response: {
      data: {
        Codigo: '404',
        Mensagem: 'Not Found',
      },
    },
  };
  return Promise.reject(error);
};
